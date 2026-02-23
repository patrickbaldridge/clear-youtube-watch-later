# clear-youtube-watch-later

Bulk-remove all videos from your YouTube Watch Later playlist using YouTube's internal InnerTube API.

## Requirements

- [Bun](https://bun.sh) runtime
- A YouTube account with videos in Watch Later

## Setup

### 1. Install dependencies

```sh
bun install
```

### 2. Get your YouTube cookie string

YouTube requires browser cookies to authenticate. Here's how to grab them:

1. Open Chrome and go to [youtube.com/playlist?list=WL](https://www.youtube.com/playlist?list=WL) — make sure you're logged in
2. Open DevTools (`F12` or `Cmd+Option+I`)
3. Go to the **Network** tab and refresh the page (`Cmd+R` / `F5`)
4. Click the first request named `playlist?list=WL`
5. Scroll down to **Request Headers** and find the `cookie:` header
6. Right-click the value → **Copy value** (it will be a very long string)

### 3. Configure your credentials

```sh
cp .env.example .env
```

Open `.env` and paste your cookie string as the value for `YT_COOKIES_RAW`:

```
YT_COOKIES_RAW=VISITOR_INFO1_LIVE=xxx; SID=xxx; HSID=xxx; ...
```

> **Warning:** This cookie string grants full access to your Google account. Never share it or commit it to version control. The `.env` file is already in `.gitignore`.

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
Fetching all Watch Later videos...
Found 328 video(s) in Watch Later.

Deleting 328 video(s)...
[1/328] Removed: Some Video Title
[2/328] Removed: Another Video
...
Done. Removed 328 video(s).
```

## Options

Set these in your `.env` file:

| Variable | Required | Default | Description |
|---|---|---|---|
| `YT_COOKIES_RAW` | Yes | — | Your full browser cookie string |
| `DELETION_DELAY_MS` | No | `500` | Milliseconds to wait between deletions |

## Notes

- **Cookies expire** — if you see an auth error, grab a fresh cookie string from Chrome and update `YT_COOKIES_RAW` in `.env`
- **If some deletions fail**, just re-run the tool — already-removed videos won't reappear
- YouTube's Watch Later has no official public API; this uses the same internal API as the YouTube web client
