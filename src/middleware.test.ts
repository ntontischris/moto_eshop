import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Spies are declared via vi.hoisted so they exist when the hoisted vi.mock
// factories below run at import time.
const { intlMiddleware, getUser } = vi.hoisted(() => ({
  intlMiddleware: vi.fn((request: NextRequest) =>
    NextResponse.next({ request }),
  ),
  // Supabase getUser spy: lets us assert whether the auth round-trip ran at all.
  getUser: vi.fn(
    async (): Promise<{ data: { user: { id: string } | null } }> => ({
      data: { user: null },
    }),
  ),
}));

// next-intl middleware: a pass-through that just continues the request, so the
// middleware-under-test reaches its auth block on localized paths.
vi.mock("next-intl/middleware", () => ({
  default: () => intlMiddleware,
}));

// No legacy alias ever matches in these tests.
vi.mock("@/lib/alias-redirects", () => ({
  resolveAliasTarget: vi.fn(async () => null),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: { getUser } })),
}));

import { middleware } from "./middleware";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  getUser.mockResolvedValue({ data: { user: null } });
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.clearAllMocks();
});

function req(pathname: string) {
  return new NextRequest(new URL(`https://shop.test${pathname}`));
}

describe("middleware auth gating", () => {
  it("does NOT call getUser on an anonymous public path (default locale)", async () => {
    await middleware(req("/some-category/some-product"));
    expect(getUser).not.toHaveBeenCalled();
  });

  it("does NOT call getUser on an anonymous public path (prefixed locale)", async () => {
    await middleware(req("/en/some-category"));
    expect(getUser).not.toHaveBeenCalled();
  });

  it("calls getUser on a protected path", async () => {
    await middleware(req("/account"));
    expect(getUser).toHaveBeenCalledOnce();
  });

  it("calls getUser on a prefixed protected path", async () => {
    await middleware(req("/en/account/orders"));
    expect(getUser).toHaveBeenCalledOnce();
  });

  it("calls getUser on an auth page", async () => {
    await middleware(req("/login"));
    expect(getUser).toHaveBeenCalledOnce();
  });

  it("redirects an unauthenticated user away from a protected path", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await middleware(req("/account"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects an authenticated user away from an auth page", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await middleware(req("/login"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/account");
  });

  it("lets an authenticated user through on a protected path", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await middleware(req("/account"));
    expect(res.headers.get("location")).toBeNull();
  });
});
