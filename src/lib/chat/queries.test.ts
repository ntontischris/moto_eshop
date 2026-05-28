import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadRecentMessages, RECENT_MESSAGE_WINDOW } from "./queries";

const supabaseMock = {
  rpc: vi.fn(),
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

describe("queries", () => {
  beforeEach(() => {
    supabaseMock.from.mockReset();
    supabaseMock.rpc.mockReset();
  });

  it("RECENT_MESSAGE_WINDOW equals 30 per spec", () => {
    expect(RECENT_MESSAGE_WINDOW).toBe(30);
  });

  it("loadRecentMessages returns rows in chronological order", async () => {
    const rows = [
      { id: "m1", role: "user", content: [], created_at: "2026-01-01" },
      { id: "m2", role: "assistant", content: [], created_at: "2026-01-02" },
    ];
    supabaseMock.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data: rows, error: null }),
          }),
        }),
      }),
    }));
    const out = await loadRecentMessages("thread_1");
    expect(out.length).toBe(2);
    expect(out[0].id).toBe("m1");
    expect(out[1].id).toBe("m2");
  });
});
