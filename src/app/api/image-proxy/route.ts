/**
 * Tiny image proxy for legacy motomarket-shop.gr images.
 *
 * The old eshop blocks Next.js Image Optimizer's User-Agent with 403, so
 * we fetch the image server-side with a normal browser UA and re-emit it
 * with long-lived cache headers. Once images are mirrored to our own CDN
 * this route can be removed.
 *
 * Usage:  /api/image-proxy?url=https://www.motomarket-shop.gr/assets/site/public/...
 *
 * Security: only allowlisted hostnames are proxied.
 */

import type { NextRequest } from "next/server";

const ALLOWED_HOSTS = new Set(["www.motomarket-shop.gr", "motomarket-shop.gr"]);

export async function GET(req: NextRequest): Promise<Response> {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return new Response("missing url", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("invalid url", { status: 400 });
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new Response("host not allowed", { status: 400 });
  }
  if (parsed.protocol !== "https:") {
    return new Response("https only", { status: 400 });
  }

  const upstream = await fetch(parsed.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
    },
    // Pass through the request's cache hints to the upstream
    cache: "force-cache",
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(`upstream ${upstream.status}`, {
      status: upstream.status,
    });
  }

  // Buffer the body so we can emit an accurate Content-Length. The Next.js
  // image optimizer rejects responses with a missing/empty Content-Length,
  // which is why optimizing through this proxy used to 400.
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(body.byteLength),
    },
  });
}
