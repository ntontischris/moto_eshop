import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface CheckLimitInput {
  key: string;
  isAnonymous: boolean;
}

interface CheckLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let anonLimiter: Ratelimit | null = null;
let authedLimiter: Ratelimit | null = null;

if (url && token) {
  const redis = new Redis({ url, token });
  anonLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(40, "1 h"),
    prefix: "chat:anon",
  });
  authedLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(80, "1 h"),
    prefix: "chat:user",
  });
}

export async function checkRateLimit({
  key,
  isAnonymous,
}: CheckLimitInput): Promise<CheckLimitResult> {
  if (!anonLimiter || !authedLimiter) {
    return { ok: true, limit: Infinity, remaining: Infinity, reset: 0 };
  }
  const limiter = isAnonymous ? anonLimiter : authedLimiter;
  const r = await limiter.limit(key);
  return {
    ok: r.success,
    limit: r.limit,
    remaining: r.remaining,
    reset: r.reset,
  };
}
