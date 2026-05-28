import { describe, it, expect } from "vitest";
import {
  generateSessionId,
  isValidSessionId,
  SESSION_COOKIE_NAME,
} from "./session";

describe("generateSessionId", () => {
  it("returns a string longer than 20 chars", () => {
    const id = generateSessionId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(20);
  });

  it("returns a different value on each call", () => {
    const a = generateSessionId();
    const b = generateSessionId();
    expect(a).not.toBe(b);
  });

  it("returned id passes isValidSessionId", () => {
    expect(isValidSessionId(generateSessionId())).toBe(true);
  });
});

describe("isValidSessionId", () => {
  it("rejects empty string", () => {
    expect(isValidSessionId("")).toBe(false);
  });
  it("rejects too short", () => {
    expect(isValidSessionId("abc")).toBe(false);
  });
  it("rejects values with spaces", () => {
    expect(isValidSessionId("aaaaaaaaaaaaaaaaaaaa bbb")).toBe(false);
  });
  it("accepts a 32-char alphanumeric", () => {
    expect(isValidSessionId("a".repeat(32))).toBe(true);
  });
});

describe("SESSION_COOKIE_NAME", () => {
  it("is exactly mm_chat_session", () => {
    expect(SESSION_COOKIE_NAME).toBe("mm_chat_session");
  });
});
