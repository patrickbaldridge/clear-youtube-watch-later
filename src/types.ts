export interface VideoItem {
  videoId: string;
  setVideoId: string;
  title: string;
}

export interface InnerTubeConfig {
  apiKey: string;
  clientVersion: string;
}

export interface InnerTubeContext {
  client: {
    clientName: string;
    clientVersion: string;
    hl: string;
    gl: string;
  };
}

export interface ContinuationItem {
  playlistVideoRenderer?: {
    videoId: string;
    setVideoId: string;
    title: { runs: Array<{ text: string }> };
  };
  continuationItemRenderer?: {
    continuationEndpoint: {
      // Direct path (older structure)
      continuationCommand?: { token: string };
      // Nested path (current structure)
      commandExecutorCommand?: {
        commands: Array<{
          continuationCommand?: { token: string };
        }>;
      };
    };
  };
}

export interface BrowseResponse {
  onResponseReceivedActions?: Array<{
    appendContinuationItemsAction?: {
      continuationItems: ContinuationItem[];
    };
  }>;
}
