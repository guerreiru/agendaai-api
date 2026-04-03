import type { CookieOptions } from "express";
import { REFRESH_TOKEN_EXPIRES_IN_MS } from "./refresh-token";

export const REFRESH_COOKIE_NAME = "refresh_token";

export function getRefreshCookieBaseOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/auth/refresh",
  };
}

export function getRefreshCookieOptions(): CookieOptions {
  return {
    ...getRefreshCookieBaseOptions(),
    maxAge: REFRESH_TOKEN_EXPIRES_IN_MS,
  };
}

export function getRefreshClearCookieOptions(): CookieOptions {
  return getRefreshCookieBaseOptions();
}
