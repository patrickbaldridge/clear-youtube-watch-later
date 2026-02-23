import type { Config } from "./config.ts";
import type {
  VideoItem,
  InnerTubeConfig,
  InnerTubeContext,
  BrowseResponse,
  ContinuationItem,
} from "./types.ts";
import { httpGet, httpPost, log } from "./utils.ts";

const PLAYLIST_URL = "https://www.youtube.com/playlist?list=WL";
const BROWSE_URL = "https://www.youtube.com/youtubei/v1/browse";

function extractJson<T>(html: string, varName: string): T | null {
  // Match assignment like: var ytInitialData = {...}; or ytcfg.set({...})
  const pattern =
    varName === "ytcfg.set"
      ? /ytcfg\.set\((\{[\s\S]*?\})\);/
      : new RegExp(`var ${varName}\\s*=\\s*(\\{[\\s\\S]*?\\});`);
  const match = html.match(pattern);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}

function parseInnerTubeConfig(html: string): InnerTubeConfig {
  // ytcfg.set may appear multiple times; grab the one with INNERTUBE_API_KEY
  const matches = [...html.matchAll(/ytcfg\.set\((\{[\s\S]*?\})\)/g)];
  for (const m of matches) {
    try {
      const obj = JSON.parse(m[1]) as Record<string, unknown>;
      if (obj.INNERTUBE_API_KEY && obj.INNERTUBE_CLIENT_VERSION) {
        return {
          apiKey: obj.INNERTUBE_API_KEY as string,
          clientVersion: obj.INNERTUBE_CLIENT_VERSION as string,
        };
      }
    } catch {
      // continue to next match
    }
  }
  throw new Error("Could not extract INNERTUBE_API_KEY / INNERTUBE_CLIENT_VERSION from page");
}

function makeContext(clientVersion: string): InnerTubeContext {
  return {
    client: {
      clientName: "WEB",
      clientVersion,
      hl: "en",
      gl: "US",
    },
  };
}

function extractVideosFromList(items: ContinuationItem[]): VideoItem[] {
  return items
    .filter((item) => item.playlistVideoRenderer !== undefined)
    .map((item) => {
      const r = item.playlistVideoRenderer!;
      return {
        videoId: r.videoId,
        setVideoId: r.setVideoId,
        title: r.title?.runs?.[0]?.text ?? "(untitled)",
      };
    });
}

function extractContinuationToken(items: ContinuationItem[]): string | null {
  for (const item of items) {
    const endpoint = item.continuationItemRenderer?.continuationEndpoint;
    if (!endpoint) continue;

    // Direct path (older structure)
    if (endpoint.continuationCommand?.token) {
      return endpoint.continuationCommand.token;
    }

    // Nested path: commandExecutorCommand.commands[].continuationCommand.token
    const commands = endpoint.commandExecutorCommand?.commands ?? [];
    for (const cmd of commands) {
      if (cmd.continuationCommand?.token) {
        return cmd.continuationCommand.token;
      }
    }
  }
  return null;
}

export interface FetchResult {
  videos: VideoItem[];
  innerTubeCfg: InnerTubeConfig;
}

export async function fetchAllVideos(config: Config): Promise<FetchResult> {
  log.info("Fetching Watch Later playlist page...");
  const html = await httpGet(PLAYLIST_URL, config);

  // Parse initial data
  const ytInitialData = extractJson<Record<string, unknown>>(
    html,
    "ytInitialData"
  );
  if (!ytInitialData) {
    throw new Error(
      "Could not extract ytInitialData — are your cookies valid?"
    );
  }

  const innerTubeCfg = parseInnerTubeConfig(html);
  const context = makeContext(innerTubeCfg.clientVersion);

  // Navigate to playlistVideoListRenderer
  const tab = (
    ytInitialData?.contents as Record<string, unknown>
  )?.twoColumnBrowseResultsRenderer as Record<string, unknown>;
  const tabs = tab?.tabs as Array<Record<string, unknown>>;
  const tabRenderer = tabs?.[0]?.tabRenderer as Record<string, unknown>;
  const sectionList = (tabRenderer?.content as Record<string, unknown>)
    ?.sectionListRenderer as Record<string, unknown>;
  const itemSection = (
    sectionList?.contents as Array<Record<string, unknown>>
  )?.[0]?.itemSectionRenderer as Record<string, unknown>;
  const playlistVideoList = (
    itemSection?.contents as Array<Record<string, unknown>>
  )?.[0]?.playlistVideoListRenderer as Record<string, unknown>;

  if (!playlistVideoList) {
    // YouTube returns no playlistVideoListRenderer when the playlist is empty
    const alerts = ytInitialData?.alerts as Array<Record<string, unknown>> | undefined;
    const isEmptyPlaylist = alerts?.some((a) => {
      const text = (a?.alertRenderer as Record<string, unknown>)?.text as Record<string, unknown>;
      const runs = text?.runs as Array<Record<string, unknown>>;
      return runs?.[0]?.text === "The playlist does not exist.";
    });
    if (isEmptyPlaylist) {
      return { videos: [], innerTubeCfg };
    }
    throw new Error(
      "Could not find playlistVideoListRenderer — your cookies may be expired. Refresh YT_COOKIES_RAW in .env and try again."
    );
  }

  const initialContents = playlistVideoList.contents as ContinuationItem[];
  const videos: VideoItem[] = extractVideosFromList(initialContents ?? []);

  // Get initial continuation token (separate field)
  const continuations = playlistVideoList.continuations as Array<
    Record<string, unknown>
  >;
  let continuationToken: string | null =
    (
      continuations?.[0]?.nextContinuationData as Record<string, unknown>
    )?.continuation as string ?? null;

  // Also check if continuation is embedded in the contents list
  if (!continuationToken && initialContents) {
    continuationToken = extractContinuationToken(initialContents);
  }

  // Paginate
  let page = 1;
  while (continuationToken) {
    page++;
    log.info(`Fetching page ${page}...`);
    const body = {
      context,
      continuation: continuationToken,
    };
    const res = await httpPost<BrowseResponse>(
      `${BROWSE_URL}?key=${innerTubeCfg.apiKey}`,
      body,
      config
    );

    const actions = res.onResponseReceivedActions;
    if (!actions?.length) break;

    const items =
      actions[0]?.appendContinuationItemsAction?.continuationItems ?? [];
    videos.push(...extractVideosFromList(items));
    continuationToken = extractContinuationToken(items);
  }

  return { videos, innerTubeCfg };
}
