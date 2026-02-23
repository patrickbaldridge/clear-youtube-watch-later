export interface Config {
  // For SAPISIDHASH computation
  sapisid: string;
  secure1Papisid: string;
  secure3Papisid: string;
  // Full cookie header string (either from YT_COOKIES_RAW or built from individual vars)
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
  const delayRaw = process.env.DELETION_DELAY_MS;
  const deletionDelayMs = delayRaw ? parseInt(delayRaw, 10) : 500;

  const rawCookies = process.env.YT_COOKIES_RAW;

  if (rawCookies) {
    // Extract the three SAPISID variants from the raw cookie string for SAPISIDHASH
    const sapisid = extractCookie(rawCookies, "SAPISID");
    const secure1Papisid = extractCookie(rawCookies, "__Secure-1PAPISID");
    const secure3Papisid = extractCookie(rawCookies, "__Secure-3PAPISID");

    const missing: string[] = [];
    if (!sapisid) missing.push("SAPISID (in YT_COOKIES_RAW)");
    if (!secure1Papisid) missing.push("__Secure-1PAPISID (in YT_COOKIES_RAW)");
    if (!secure3Papisid) missing.push("__Secure-3PAPISID (in YT_COOKIES_RAW)");

    if (missing.length > 0) {
      console.error("YT_COOKIES_RAW is set but missing required cookies:");
      for (const m of missing) console.error(`  ${m}`);
      process.exit(1);
    }

    return {
      sapisid: sapisid!,
      secure1Papisid: secure1Papisid!,
      secure3Papisid: secure3Papisid!,
      cookieHeader: rawCookies,
      deletionDelayMs,
    };
  }

  // Fall back to individual env vars
  const required: Record<string, string | undefined> = {
    YT_COOKIE_SAPISID: process.env.YT_COOKIE_SAPISID,
    YT_COOKIE_SECURE_1PAPISID: process.env.YT_COOKIE_SECURE_1PAPISID,
    YT_COOKIE_SECURE_3PAPISID: process.env.YT_COOKIE_SECURE_3PAPISID,
    YT_COOKIE_SID: process.env.YT_COOKIE_SID,
    YT_COOKIE_HSID: process.env.YT_COOKIE_HSID,
    YT_COOKIE_SSID: process.env.YT_COOKIE_SSID,
  };

  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    for (const key of missing) {
      console.error(`  ${key}`);
    }
    console.error(
      "\nPreferred: set YT_COOKIES_RAW to your full browser cookie string."
    );
    console.error("See .env.example for instructions.");
    process.exit(1);
  }

  const cookieHeader = [
    `SAPISID=${required.YT_COOKIE_SAPISID}`,
    `__Secure-1PAPISID=${required.YT_COOKIE_SECURE_1PAPISID}`,
    `__Secure-3PAPISID=${required.YT_COOKIE_SECURE_3PAPISID}`,
    `SID=${required.YT_COOKIE_SID}`,
    `HSID=${required.YT_COOKIE_HSID}`,
    `SSID=${required.YT_COOKIE_SSID}`,
  ].join("; ");

  return {
    sapisid: required.YT_COOKIE_SAPISID!,
    secure1Papisid: required.YT_COOKIE_SECURE_1PAPISID!,
    secure3Papisid: required.YT_COOKIE_SECURE_3PAPISID!,
    cookieHeader,
    deletionDelayMs,
  };
}
