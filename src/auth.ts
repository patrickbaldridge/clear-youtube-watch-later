import { createHash } from "crypto";
import type { Config } from "./config.ts";

function sapisidHash(timestamp: number, sapisid: string): string {
  const data = `${timestamp} ${sapisid} https://www.youtube.com`;
  return createHash("sha1").update(data).digest("hex");
}

export function buildAuthorizationHeader(config: Config): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const hash1 = sapisidHash(timestamp, config.sapisid);
  const hash2 = sapisidHash(timestamp, config.secure1Papisid);
  const hash3 = sapisidHash(timestamp, config.secure3Papisid);
  return `SAPISIDHASH ${timestamp}_${hash1} SAPISID1PHASH ${timestamp}_${hash2} SAPISID3PHASH ${timestamp}_${hash3}`;
}

export function buildHeaders(config: Config): Record<string, string> {
  return {
    Authorization: buildAuthorizationHeader(config),
    Cookie: config.cookieHeader,
    "X-Origin": "https://www.youtube.com",
    "X-Goog-AuthUser": "0",
    "Content-Type": "application/json",
    "Accept-Encoding": "gzip, deflate",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  };
}
