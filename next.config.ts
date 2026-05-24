import path from "path";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow our internal image proxy paths with query strings (Next.js 16 requirement).
    // Allow all local paths — when localPatterns is set, anything missing here
    // is blocked, so include both /api/image-proxy (with query string) and
    // every static asset under /public (e.g. /logo.png, /favicon.ico).
    localPatterns: [{ pathname: "/**" }],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        // Legacy eshop — temporary source for migrated product photos
        // until we mirror them to our own CDN.
        protocol: "https",
        hostname: "www.motomarket-shop.gr",
      },
      {
        // Higgsfield generated assets (preview routes only)
        protocol: "https",
        hostname: "d8j0ntlcm91z4.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "d2ol7oe51mr4n9.cloudfront.net",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
