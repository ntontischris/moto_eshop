import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getReviewStats } from "./reviews";

/** Fake client whose reviews→select→eq→eq chain resolves to the given ratings. */
function makeClient(ratings: number[]) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    then: (resolve: (r: unknown) => void) =>
      resolve({ data: ratings.map((rating) => ({ rating })), error: null }),
  };
  return {
    from: () => chain,
  } as unknown as Awaited<ReturnType<typeof createClient>>;
}

beforeEach(() => vi.clearAllMocks());

describe("getReviewStats", () => {
  it("returns zeroed stats when there are no approved reviews", async () => {
    vi.mocked(createClient).mockResolvedValue(makeClient([]));
    const stats = await getReviewStats("p1");
    expect(stats).toEqual({
      average_rating: 0,
      total_count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  });

  it("averages ratings and builds the star distribution", async () => {
    vi.mocked(createClient).mockResolvedValue(makeClient([5, 5, 4, 3, 3]));
    const stats = await getReviewStats("p1");
    expect(stats.total_count).toBe(5);
    expect(stats.average_rating).toBe(4); // (5+5+4+3+3)/5 = 4.0
    expect(stats.distribution).toEqual({ 1: 0, 2: 0, 3: 2, 4: 1, 5: 2 });
  });

  it("rounds the average to one decimal", async () => {
    vi.mocked(createClient).mockResolvedValue(makeClient([5, 4, 4]));
    const stats = await getReviewStats("p1");
    expect(stats.average_rating).toBe(4.3); // 13/3 = 4.333 → 4.3
  });
});
