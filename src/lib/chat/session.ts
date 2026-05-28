import { randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "mm_chat_session";

/** 32-char URL-safe id from 24 random bytes (base64url-ish). */
export function generateSessionId(): string {
  return randomBytes(24)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const VALID_RE = /^[A-Za-z0-9_-]{20,}$/;

export function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && VALID_RE.test(value);
}

export interface ChatSessionCookieOptions {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
}

export const SESSION_COOKIE_OPTIONS: ChatSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};
