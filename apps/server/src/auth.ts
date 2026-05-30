import { createMiddleware } from "hono/factory";
import type { ServerConfig } from "./config.js";

/**
 * API キー認証ミドルウェア。config.apiKey が設定されている場合のみ要求する。
 * `X-API-Key: <key>` もしくは `Authorization: Bearer <key>` を受け付ける。
 */
export function apiKeyAuth(config: ServerConfig) {
  return createMiddleware(async (c, next) => {
    if (!config.apiKey) return next();

    const header =
      c.req.header("x-api-key") ?? c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (header !== config.apiKey) {
      return c.json({ error: "unauthorized" }, 401);
    }
    return next();
  });
}
