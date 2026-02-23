import type { Config } from "./config.ts";
import { buildHeaders } from "./auth.ts";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    message: string
  ) {
    super(`HTTP ${status} from ${url}: ${message}`);
    this.name = "HttpError";
  }
}

export const log = {
  info: (msg: string) => console.log(msg),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
};

export async function httpGet(url: string, config: Config): Promise<string> {
  const headers = buildHeaders(config);
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new HttpError(res.status, url, await res.text().catch(() => ""));
  }
  return res.text();
}

export async function httpPost<T>(
  url: string,
  body: unknown,
  config: Config
): Promise<T> {
  const headers = buildHeaders(config);
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new HttpError(res.status, url, await res.text().catch(() => ""));
  }
  return res.json() as Promise<T>;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
