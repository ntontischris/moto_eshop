import { describe, it, expect } from "vitest";
import { envSchema } from "./env";

const validCore = {
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
  NEXT_PUBLIC_SITE_URL: "https://motomarket.gr",
};

describe("envSchema", () => {
  it("accepts a valid core environment with no optional vars", () => {
    const r = envSchema.safeParse(validCore);
    expect(r.success).toBe(true);
  });

  it("rejects when a required core var is missing", () => {
    const { NEXT_PUBLIC_SITE_URL: _omit, ...partial } = validCore;
    const r = envSchema.safeParse(partial);
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(
      r.error.issues.some((i) => i.path[0] === "NEXT_PUBLIC_SITE_URL"),
    ).toBe(true);
  });

  it("rejects a malformed core URL", () => {
    const r = envSchema.safeParse({
      ...validCore,
      NEXT_PUBLIC_SITE_URL: "nope",
    });
    expect(r.success).toBe(false);
  });

  it("allows optional feature vars to be present", () => {
    const r = envSchema.safeParse({
      ...validCore,
      ENTERSOFT_API_KEY: "k",
      OPENAI_API_KEY: "sk-x",
    });
    expect(r.success).toBe(true);
  });
});
