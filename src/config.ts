export interface Config {
  sapisid: string;
  secure1Papisid: string;
  secure3Papisid: string;
  cookieHeader: string;
  deletionDelayMs: number;
}

/** Extract a named cookie value from a raw cookie string. */
export function extractCookie(raw: string, name: string): string | null {
  for (const part of raw.split(/;\s*/)) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    if (part.slice(0, eqIdx).trim() === name) {
      return part.slice(eqIdx + 1);
    }
  }
  return null;
}

export function loadConfig(): Config {
  const rawCookies = process.env.YT_COOKIES_RAW;

  if (!rawCookies) {
    console.error("Missing required environment variable: YT_COOKIES_RAW");
    console.error("\nCopy .env.example to .env and fill in your YouTube cookies.");
    process.exit(1);
  }

  const sapisid = extractCookie(rawCookies, "SAPISID");
  const secure1Papisid = extractCookie(rawCookies, "__Secure-1PAPISID");
  const secure3Papisid = extractCookie(rawCookies, "__Secure-3PAPISID");

  const missing: string[] = [];
  if (!sapisid) missing.push("SAPISID");
  if (!secure1Papisid) missing.push("__Secure-1PAPISID");
  if (!secure3Papisid) missing.push("__Secure-3PAPISID");

  if (missing.length > 0) {
    console.error("YT_COOKIES_RAW is missing required cookies:");
    for (const m of missing) console.error(`  ${m}`);
    process.exit(1);
  }

  const delayRaw = process.env.DELETION_DELAY_MS;
  const deletionDelayMs = delayRaw ? parseInt(delayRaw, 10) : 500;

  return {
    sapisid: sapisid!,
    secure1Papisid: secure1Papisid!,
    secure3Papisid: secure3Papisid!,
    cookieHeader: rawCookies,
    deletionDelayMs,
  };
}
