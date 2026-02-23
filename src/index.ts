import { loadConfig } from "./config.ts";
import { fetchAllVideos } from "./playlist.ts";
import { deleteVideos } from "./delete.ts";
import { log } from "./utils.ts";

const HELP = `
clear-youtube-watch-later — Bulk-remove all videos from your YouTube Watch Later playlist

USAGE:
  bun run src/index.ts [OPTIONS]

OPTIONS:
  --dry-run   List all videos without deleting them
  --help      Show this help message

SETUP:
  1. Copy .env.example to .env
  2. Fill in your YouTube cookies (see instructions in .env.example)
  3. Run: bun run src/index.ts
`.trim();

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    process.exit(0);
  }

  const dryRun = args.includes("--dry-run");

  const config = loadConfig();

  log.info("Fetching all Watch Later videos...");
  const { videos, innerTubeCfg } = await fetchAllVideos(config);

  if (videos.length === 0) {
    log.info("Watch Later playlist is already empty.");
    process.exit(0);
  }

  log.info(`Found ${videos.length} video(s) in Watch Later.`);

  if (dryRun) {
    log.info("\n[DRY RUN] Videos that would be removed:");
    for (let i = 0; i < videos.length; i++) {
      console.log(`  ${i + 1}. ${videos[i].title}`);
    }
    log.info(`\n[DRY RUN] ${videos.length} video(s) would be removed.`);
    process.exit(0);
  }

  log.info(`\nDeleting ${videos.length} video(s)...`);
  const { deleted, failed } = await deleteVideos(
    videos,
    innerTubeCfg.clientVersion,
    innerTubeCfg.apiKey,
    config
  );

  log.info(`\nDone. Removed ${deleted} video(s).`);
  if (failed > 0) {
    log.warn(
      `${failed} deletion(s) failed. Re-run the tool to retry — already-removed videos won't reappear.`
    );
  }
}

main().catch((err) => {
  log.error(String(err));
  process.exit(1);
});
