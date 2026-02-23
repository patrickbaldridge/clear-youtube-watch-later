# clear-youtube-watch-later

Bulk-remove all videos from your YouTube Watch Later playlist using YouTube's internal InnerTube API.

## Requirements

- [Bun](https://bun.sh) runtime
- A YouTube account with videos in Watch Later

## Setup

1. **Install dependencies:**
   ```sh
   bun install
   ```

2. **Get your YouTube cookies:**
   1. Open Chrome and go to `https://www.youtube.com/playlist?list=WL` (must be logged in)
   2. Open DevTools → Application tab → Cookies → `https://www.youtube.com`
   3. Copy the values for: `SAPISID`, `__Secure-1PAPISID`, `__Secure-3PAPISID`, `SID`, `HSID`, `SSID`

3. **Configure credentials:**
   ```sh
   cp .env.example .env
   # Edit .env and paste in the cookie values
   ```

## Usage

```sh
# Preview what would be deleted (no changes made)
bun run src/index.ts --dry-run

# Delete all Watch Later videos
bun run src/index.ts

# Show help
bun run src/index.ts --help
```

Progress is shown as each video is removed:
```
[1/47] Removed: Some Video Title
[2/47] Removed: Another Video
...
Done. Removed 47 video(s).
```

## Options

| Variable | Default | Description |
|---|---|---|
| `DELETION_DELAY_MS` | `500` | Milliseconds to wait between deletions |

## Notes

- **Cookies grant full Google account access** — never share your `.env` file
- If some deletions fail, re-run the tool — already-removed videos won't reappear
- YouTube's Watch Later has no official public API; this uses the same internal API as the YouTube web client
