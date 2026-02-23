import type { Config } from "./config.ts";
import type { VideoItem, InnerTubeContext } from "./types.ts";
import { httpPost, log, sleep, HttpError } from "./utils.ts";

const EDIT_PLAYLIST_URL =
  "https://www.youtube.com/youtubei/v1/browse/edit_playlist";

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

export async function deleteVideos(
  videos: VideoItem[],
  clientVersion: string,
  apiKey: string,
  config: Config
): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;
  const total = videos.length;
  const context = makeContext(clientVersion);

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const progress = `[${i + 1}/${total}]`;

    try {
      await httpPost(
        `${EDIT_PLAYLIST_URL}?key=${apiKey}`,
        {
          context,
          actions: [
            {
              action: "ACTION_REMOVE_VIDEO",
              setVideoId: video.setVideoId,
            },
          ],
          playlistId: "WL",
        },
        config
      );

      deleted++;
      log.info(`${progress} Removed: ${video.title}`);
    } catch (err) {
      failed++;
      if (err instanceof HttpError) {
        log.warn(`${progress} Failed (HTTP ${err.status}): ${video.title}`);
      } else {
        log.warn(`${progress} Failed: ${video.title} — ${String(err)}`);
      }
    }

    if (i < videos.length - 1) {
      await sleep(config.deletionDelayMs);
    }
  }

  return { deleted, failed };
}
