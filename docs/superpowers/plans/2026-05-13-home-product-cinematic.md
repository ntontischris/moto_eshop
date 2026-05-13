# Home + Product Cinematic Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign homepage and product page to Race-Grade Cinematic quality with scroll-driven video hero, polished trust bar, bento categories, carousel featured products, marquee brands, and a vertical-gallery sticky-info product page.

**Architecture:** Implement in **incremental, independently-shippable phases**. Phase 0 builds hero infrastructure with placeholder frames so visual progress is unblocked while real video is generated in parallel (Phase 1). Each component rewrite is its own commit. No tests for purely-visual components — those are verified by the user in the browser; logic that has well-defined input/output (scroll progress mapping) IS tested.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind 4, TypeScript 5, Supabase (data), Framer Motion (animations), Lenis (smooth scroll), `next/image`, Higgsfield MCP (video gen), `ffmpeg` (CLI, video→frames), shadcn/ui primitives, Lucide icons. All deps already installed.

**Spec:** `docs/superpowers/specs/2026-05-13-home-product-cinematic-design.md`

---

## Phase 0 — Hero scroll-video infrastructure

Build the cinematic hero component with placeholder frames so we can iterate on the UI while the real video is being generated in Phase 1.

---

### Task 0.1: Add Vitest to the project (test runner for pure logic)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/hero/.gitkeep` (placeholder)

- [ ] **Step 1: Install dependencies**

```bash
pnpm add -D vitest @vitest/ui jsdom @testing-library/jest-dom
```

Expected: Adds packages, lockfile updates.

- [ ] **Step 2: Create vitest config**

Write `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

- [ ] **Step 3: Add npm script**

Modify `package.json` `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Sanity-run vitest**

```bash
pnpm test
```

Expected: "No test files found" (zero failures, zero tests). That's fine — confirms Vitest is wired.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "chore: add vitest for hero logic unit tests"
```

---

### Task 0.2: Scroll-progress utility with tests

**Files:**
- Create: `src/lib/hero/scroll-progress.ts`
- Create: `src/lib/hero/scroll-progress.test.ts`

- [ ] **Step 1: Write the failing test**

Write `src/lib/hero/scroll-progress.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { frameIndexForProgress, opacityForRange } from "./scroll-progress";

describe("frameIndexForProgress", () => {
  it("returns 0 when progress is 0", () => {
    expect(frameIndexForProgress(0, 120)).toBe(0);
  });

  it("returns last frame when progress is 1", () => {
    expect(frameIndexForProgress(1, 120)).toBe(119);
  });

  it("clamps below 0 to 0", () => {
    expect(frameIndexForProgress(-0.5, 120)).toBe(0);
  });

  it("clamps above 1 to last frame", () => {
    expect(frameIndexForProgress(1.5, 120)).toBe(119);
  });

  it("maps 0.5 to middle frame", () => {
    expect(frameIndexForProgress(0.5, 120)).toBe(60);
  });
});

describe("opacityForRange", () => {
  it("returns 0 below the range", () => {
    expect(opacityForRange(0.1, 0.2, 0.4)).toBe(0);
  });

  it("returns 1 above the range", () => {
    expect(opacityForRange(0.6, 0.2, 0.4)).toBe(1);
  });

  it("returns 0.5 at midpoint of range", () => {
    expect(opacityForRange(0.3, 0.2, 0.4)).toBeCloseTo(0.5, 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/lib/hero/scroll-progress.test.ts
```

Expected: FAIL with "Cannot find module './scroll-progress'"

- [ ] **Step 3: Implement**

Write `src/lib/hero/scroll-progress.ts`:

```ts
/**
 * Pure helpers for scroll-driven hero animation.
 *
 * `frameIndexForProgress` maps a normalized scroll progress (0..1) to a
 * concrete frame index (0..frameCount-1), clamping out-of-range inputs.
 *
 * `opacityForRange` returns a smooth 0..1 opacity for a value that should
 * fade in across [start, end].
 */

export function frameIndexForProgress(
  progress: number,
  frameCount: number,
): number {
  const clamped = Math.min(1, Math.max(0, progress));
  const lastIndex = frameCount - 1;
  return Math.round(clamped * lastIndex);
}

export function opacityForRange(
  value: number,
  start: number,
  end: number,
): number {
  if (value <= start) return 0;
  if (value >= end) return 1;
  return (value - start) / (end - start);
}
```

- [ ] **Step 4: Run test to verify pass**

```bash
pnpm test src/lib/hero/scroll-progress.test.ts
```

Expected: 8 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/hero/scroll-progress.ts src/lib/hero/scroll-progress.test.ts
git commit -m "feat(hero): scroll-progress utility with tests"
```

---

### Task 0.3: Placeholder hero frames in /public

Create 5 simple SVG-based placeholder frames so the canvas component renders before real frames exist.

**Files:**
- Create: `public/hero-frames/placeholder-info.txt`
- Create: `scripts/generate-placeholder-frames.ts`
- Modify: `package.json` (add npm script)

- [ ] **Step 1: Write the placeholder generator**

Write `scripts/generate-placeholder-frames.ts`:

```ts
/**
 * Emit 120 PNG placeholder frames so the hero renders before the
 * real Higgsfield video lands. Each frame is a dark gradient with
 * the frame number stamped on it — purely a visual stand-in.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const FRAME_COUNT = 120;
const OUT = join(process.cwd(), "public", "hero-frames");
mkdirSync(OUT, { recursive: true });

function svgFor(i: number): string {
  const hue = 0; // red family
  const lightness = 8 + Math.round((i / FRAME_COUNT) * 22); // 8% → 30%
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, 60%, ${lightness}%)"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#g)"/>
  <text x="960" y="540" text-anchor="middle" fill="#fff" opacity="0.4"
        font-family="monospace" font-size="48">
    placeholder frame ${i + 1} / ${FRAME_COUNT}
  </text>
</svg>`;
}

for (let i = 0; i < FRAME_COUNT; i++) {
  const num = String(i).padStart(4, "0");
  writeFileSync(join(OUT, `${num}.svg`), svgFor(i));
}
console.log(`✓ wrote ${FRAME_COUNT} placeholder SVG frames to ${OUT}`);
```

- [ ] **Step 2: Add npm script**

In `package.json`, under `"scripts"`:

```json
"hero:placeholder": "tsx scripts/generate-placeholder-frames.ts"
```

- [ ] **Step 3: Run it**

```bash
pnpm hero:placeholder
```

Expected: "✓ wrote 120 placeholder SVG frames to ...public/hero-frames".

- [ ] **Step 4: Add note file explaining placeholders**

Write `public/hero-frames/placeholder-info.txt`:

```
These are placeholder SVG frames generated by scripts/generate-placeholder-frames.ts.
The real cinematic hero frames (WebP, 1920x1080, ~80 KB each) are produced in Phase 1
of the cinematic redesign plan via Higgsfield MCP + ffmpeg.
Replace this entire folder's contents before shipping to production.
```

- [ ] **Step 5: Update .gitignore so placeholder SVGs aren't committed**

Append to `.gitignore`:

```
# generated hero placeholders
/public/hero-frames/*.svg
```

(Real WebP frames in Phase 1 ARE committed.)

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-placeholder-frames.ts package.json .gitignore public/hero-frames/placeholder-info.txt
git commit -m "chore(hero): placeholder frame generator + info note"
```

---

### Task 0.4: Frame loader hook

**Files:**
- Create: `src/components/hero/use-frame-loader.ts`

- [ ] **Step 1: Implement the hook**

Write `src/components/hero/use-frame-loader.ts`:

```ts
"use client";

import { useEffect, useRef, useState } from "react";

interface Options {
  /** Total frame count, e.g. 120 */
  count: number;
  /** Frame URL builder, e.g. (i) => `/hero-frames/${pad(i)}.webp` */
  urlFor: (index: number) => string;
  /** Start preload only when this ref's element scrolls into view */
  observeRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Preloads hero frames in three priority bands:
 *   1. Frame 0 inline (load immediately on mount)
 *   2. Frames 1-30 in parallel (high priority)
 *   3. Frames 31..end lazily via requestIdleCallback batches
 *
 * Returns { frames, loaded } where frames[i] is the HTMLImageElement
 * (or null until loaded). Components draw via frames[i] if non-null.
 */
export function useFrameLoader({ count, urlFor, observeRef }: Options) {
  const framesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(count).fill(null),
  );
  const [loadedCount, setLoadedCount] = useState(0);
  const [started, setStarted] = useState(false);

  // Start when in view (or immediately if no observe ref provided)
  useEffect(() => {
    if (!observeRef?.current) {
      setStarted(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(observeRef.current);
    return () => obs.disconnect();
  }, [observeRef]);

  useEffect(() => {
    if (!started) return;

    function loadOne(i: number): Promise<void> {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          framesRef.current[i] = img;
          setLoadedCount((n) => n + 1);
          resolve();
        };
        img.onerror = () => resolve(); // tolerate missing frames
        img.src = urlFor(i);
      });
    }

    // 1) frame 0 immediately
    void loadOne(0);

    // 2) frames 1-30 in parallel
    const eager = Array.from({ length: Math.min(30, count - 1) }, (_, k) =>
      loadOne(k + 1),
    );
    void Promise.all(eager);

    // 3) the rest lazily in batches of 10
    let cursor = 31;
    function nextBatch() {
      if (cursor >= count) return;
      const end = Math.min(count, cursor + 10);
      const batch = [];
      for (let i = cursor; i < end; i++) batch.push(loadOne(i));
      cursor = end;
      Promise.all(batch).then(() => {
        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(nextBatch, { timeout: 1000 });
        } else {
          setTimeout(nextBatch, 50);
        }
      });
    }
    nextBatch();
  }, [started, count, urlFor]);

  return { frames: framesRef.current, loadedCount, started };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/hero/use-frame-loader.ts
git commit -m "feat(hero): useFrameLoader hook with prioritized preload"
```

---

### Task 0.5: ScrollVideoHero component

**Files:**
- Create: `src/components/hero/scroll-video-hero.tsx`

- [ ] **Step 1: Implement the component**

Write `src/components/hero/scroll-video-hero.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  frameIndexForProgress,
  opacityForRange,
} from "@/lib/hero/scroll-progress";
import { useFrameLoader } from "./use-frame-loader";

const FRAME_COUNT = 120;
const SCROLL_HEIGHT_VH = 200;

function frameUrl(i: number): string {
  // Placeholder phase uses .svg; Phase 1 swaps these for .webp
  const padded = String(i).padStart(4, "0");
  return `/hero-frames/${padded}.svg`;
}

export function ScrollVideoHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const { frames } = useFrameLoader({
    count: FRAME_COUNT,
    urlFor: frameUrl,
    observeRef: sectionRef,
  });

  // Detect prefers-reduced-motion (set static mid-frame)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Scroll → progress
  useEffect(() => {
    if (reducedMotion) {
      setProgress(0.5);
      return;
    }
    function update() {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const consumed = -rect.top;
      const p = total > 0 ? consumed / total : 0;
      setProgress(p);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reducedMotion]);

  // Draw current frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const idx = frameIndexForProgress(progress, FRAME_COUNT);
    const img = frames[idx] ?? frames[0];
    if (!img) return;
    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
    ctx.drawImage(img, 0, 0);
  }, [progress, frames]);

  const eyebrowOp = opacityForRange(progress, 0.05, 0.2);
  const headlineOp = opacityForRange(progress, 0.25, 0.45);
  const ctaOp = opacityForRange(progress, 0.55, 0.7);

  return (
    <section
      ref={sectionRef}
      style={{ height: `${SCROLL_HEIGHT_VH}vh`, position: "relative" }}
      className="bg-black"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
        <div className="absolute inset-0 flex flex-col items-start justify-end p-8 md:p-16">
          <p
            className="font-russo text-xs tracking-[0.3em] text-brand-red"
            style={{ opacity: eyebrowOp, transition: "opacity 100ms linear" }}
          >
            RACE-GRADE EQUIPMENT
          </p>
          <h1
            className="mt-3 font-russo text-5xl uppercase leading-none text-white md:text-8xl xl:text-9xl"
            style={{ opacity: headlineOp, transition: "opacity 100ms linear" }}
          >
            Ride. <br />
            <span className="text-brand-red">Protected.</span>
          </h1>
          <div
            className="mt-8 flex flex-wrap gap-4"
            style={{ opacity: ctaOp, transition: "opacity 100ms linear" }}
          >
            <Link
              href="/eksoplismos-anabath"
              className="rounded-full bg-brand-red px-8 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] transition hover:scale-105"
            >
              Δες τον κατάλογο
            </Link>
            <Link
              href="/prosfores"
              className="rounded-full border border-white/30 px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-white/10"
            >
              Προσφορές
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/hero/scroll-video-hero.tsx
git commit -m "feat(hero): ScrollVideoHero component with sticky canvas"
```

---

### Task 0.6: Swap hero into homepage and verify

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update homepage import**

In `src/app/page.tsx`, replace:

```tsx
import { HeroSection } from "@/components/hero/hero-section";
```

with:

```tsx
import { ScrollVideoHero } from "@/components/hero/scroll-video-hero";
```

And replace `<HeroSection slides={banners} />` with `<ScrollVideoHero />`.

- [ ] **Step 2: Run dev server**

```bash
pnpm dev
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000`. Confirm:
- Page renders without runtime errors
- Hero shows placeholder gradient that darkens as you scroll
- Eyebrow → headline → CTAs fade in at scroll progress ~5%, ~25%, ~55%
- Smooth scrolling, no jank
- Section is ~2× viewport height before page content continues

- [ ] **Step 4: Verify in DevTools**

Console: no errors. Network tab: `0000.svg` through `0029.svg` should load eagerly, the rest lazily as you scroll.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(home): replace HeroSection with ScrollVideoHero"
```

---

## Phase 1 — Real Higgsfield video

Replace placeholder SVGs with real cinematic frames. Can run in parallel with Phase 2-5 visually (other developers work on non-hero parts).

---

### Task 1.1: Higgsfield OAuth + video generation

**Files:**
- Create: `scripts/hero-prompt.md` (prompt log)
- Create: `public/hero-source.mp4` (the generated MP4)

- [ ] **Step 1: Document the prompt iteration**

Write `scripts/hero-prompt.md`:

```markdown
# Hero video prompt

## Iteration 1

> Cinematic motorcycle riding through Greek mountain road at golden hour,
> slow dolly forward camera, professional cinematography, 4K, color graded,
> no logos, no faces, no text, depth of field

Output saved as: `public/hero-source.mp4` (4 seconds, 30fps, 1920x1080)

If quality insufficient, iterate prompt with notes here.
```

- [ ] **Step 2: Authenticate Higgsfield MCP**

Invoke `mcp__higgsfield__authenticate` via Claude Code. User visits the returned URL, authorizes. Pass callback URL back via `mcp__higgsfield__complete_authentication`.

- [ ] **Step 3: Generate the video**

Use the Higgsfield MCP tools that become available after OAuth. Call the video generation tool with the prompt above. Download the resulting MP4 to `public/hero-source.mp4`.

- [ ] **Step 4: Verify the video plays**

```bash
ffprobe public/hero-source.mp4
```

Expected output mentions:
- duration ~4-6 seconds
- video stream 1920x1080 (or similar 16:9)
- 30 fps

- [ ] **Step 5: Commit the prompt log (NOT the mp4 yet — see next task)**

```bash
git add scripts/hero-prompt.md
git commit -m "docs(hero): hero video generation prompt log"
```

---

### Task 1.2: Convert video to WebP frames

**Files:**
- Create: `scripts/generate-hero-frames.ts`
- Create: `public/hero-frames/*.webp` (120 files)

- [ ] **Step 1: Verify ffmpeg is installed**

```bash
ffmpeg -version
```

If not installed: `winget install ffmpeg` (Windows) or `brew install ffmpeg` (macOS). Install before continuing.

- [ ] **Step 2: Write the conversion script**

Write `scripts/generate-hero-frames.ts`:

```ts
/**
 * Convert public/hero-source.mp4 into 120 WebP frames in
 * public/hero-frames/. Targets ~80 KB per frame.
 */
import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, unlinkSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "public", "hero-source.mp4");
const OUT = join(process.cwd(), "public", "hero-frames");
const FRAME_COUNT = 120;

mkdirSync(OUT, { recursive: true });

// Remove any stale .webp or .svg before regenerating
for (const f of readdirSync(OUT)) {
  if (f.endsWith(".webp") || f.endsWith(".svg")) unlinkSync(join(OUT, f));
}

// ffmpeg: extract exactly FRAME_COUNT evenly-spaced frames as WebP
// -vf "select=isnan(prev_selected_t)+gte(t-prev_selected_t,(duration/N))"  is complex;
// simpler: extract all frames then keep every (total/120)th.
// Even simpler: use fps filter to get FRAME_COUNT fps over the video's duration.
const cmd = [
  `ffmpeg -y -i "${SRC}"`,
  `-vf "scale=1920:-1,select=not(mod(n\\,floor(N/${FRAME_COUNT})))"`,
  `-vsync vfr -frames:v ${FRAME_COUNT}`,
  `-q:v 60`,
  `"${OUT}/%04d.webp"`,
].join(" ");

console.log("Running:", cmd);
execSync(cmd, { stdio: "inherit" });

// Rename ffmpeg's 1-indexed output to 0-indexed (0000.webp..)
const files = readdirSync(OUT)
  .filter((f) => f.endsWith(".webp"))
  .sort();
files.forEach((f, i) => {
  const newName = `${String(i).padStart(4, "0")}.webp`;
  if (f !== newName) {
    execSync(`mv "${join(OUT, f)}" "${join(OUT, newName)}"`);
  }
});

const sizes = readdirSync(OUT)
  .filter((f) => f.endsWith(".webp"))
  .map((f) => statSync(join(OUT, f)).size);
const avgKb = sizes.reduce((a, b) => a + b, 0) / sizes.length / 1024;
console.log(`✓ ${sizes.length} frames written. Avg ${avgKb.toFixed(1)} KB.`);
```

Add to `package.json`:

```json
"hero:frames": "tsx scripts/generate-hero-frames.ts"
```

- [ ] **Step 3: Run the conversion**

```bash
pnpm hero:frames
```

Expected: outputs "✓ 120 frames written. Avg ~80 KB."

- [ ] **Step 4: Update frame URL builder to use .webp**

In `src/components/hero/scroll-video-hero.tsx`, change:

```ts
return `/hero-frames/${padded}.svg`;
```

to:

```ts
return `/hero-frames/${padded}.webp`;
```

- [ ] **Step 5: Update .gitignore to allow real .webp frames**

Edit `.gitignore`:

```
# generated hero placeholders
/public/hero-frames/*.svg
# real WebP frames ARE committed
```

- [ ] **Step 6: Verify in browser**

```bash
pnpm dev
```

Open http://localhost:3000. Scroll. Hero should now show real motorcycle footage advancing as you scroll.

- [ ] **Step 7: Commit frames + script**

```bash
git add scripts/generate-hero-frames.ts package.json src/components/hero/scroll-video-hero.tsx .gitignore public/hero-frames/*.webp public/hero-source.mp4
git commit -m "feat(hero): real Higgsfield video frames"
```

---

## Phase 2 — Trust bar polish

---

### Task 2.1: Polish TrustBar styling

**Files:**
- Modify: `src/components/home/trust-bar.tsx`

- [ ] **Step 1: Read current trust bar**

Open `src/components/home/trust-bar.tsx` and inspect current markup.

- [ ] **Step 2: Replace with polished version**

Rewrite as:

```tsx
import { Truck, RotateCcw, BadgeCheck, ShieldCheck } from "lucide-react";

interface TrustItem {
  icon: string;
  label: string;
  detail: string;
}

const DEFAULTS: TrustItem[] = [
  { icon: "truck", label: "Δωρεάν αποστολή", detail: "Για παραγγελίες άνω των €50" },
  { icon: "rotate", label: "30 ημέρες επιστροφή", detail: "Χωρίς ερωτήσεις" },
  { icon: "badge", label: "100% αυθεντικά", detail: "Επίσημοι αντιπρόσωποι" },
  { icon: "shield", label: "Εγγύηση τιμής", detail: "Βρες το φθηνότερα; Σου επιστρέφουμε" },
];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  truck: Truck,
  rotate: RotateCcw,
  badge: BadgeCheck,
  shield: ShieldCheck,
};

export function TrustBar({ items }: { items: TrustItem[] }) {
  const list = items.length > 0 ? items : DEFAULTS;
  return (
    <section className="border-y border-neutral-800 bg-[#0a0a0a]">
      <div className="container mx-auto grid grid-cols-2 gap-px bg-neutral-800 md:grid-cols-4">
        {list.map((it) => {
          const Icon = ICONS[it.icon] ?? BadgeCheck;
          return (
            <div
              key={it.label}
              className="group flex items-center gap-3 bg-[#0a0a0a] px-4 py-5 transition hover:bg-neutral-900"
            >
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-brand-red/10 text-brand-red transition group-hover:bg-brand-red group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold uppercase tracking-wide text-white">
                  {it.label}
                </p>
                <p className="truncate text-xs text-neutral-400">{it.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify in browser**

Reload localhost:3000. TrustBar should now show 4 items with red icon chips, dark bg, hover lifts.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/trust-bar.tsx
git commit -m "feat(home): polished TrustBar with icon chips and dark theme"
```

---

## Phase 3 — Bento categories

---

### Task 3.1: Rewrite BentoCategories with dark grid + fallback gradients

**Files:**
- Modify: `src/components/home/bento-categories.tsx`

- [ ] **Step 1: Replace component**

Rewrite `src/components/home/bento-categories.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface Category {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  position?: number;
}

// Fixed bento layout: big tile + 2 medium + 2 small + 1 wide
// Falls back gracefully if fewer than 6 categories provided.
const TILE_CLASSES = [
  "md:col-span-2 md:row-span-2 aspect-square md:aspect-auto",
  "md:col-span-1 md:row-span-1 aspect-square",
  "md:col-span-1 md:row-span-1 aspect-square",
  "md:col-span-1 md:row-span-1 aspect-square",
  "md:col-span-1 md:row-span-1 aspect-square",
  "md:col-span-3 md:row-span-1 aspect-[3/1]",
];

const FALLBACK_GRADIENTS = [
  "from-red-600/30 to-neutral-900",
  "from-orange-500/20 to-neutral-900",
  "from-amber-400/15 to-neutral-900",
  "from-rose-500/20 to-neutral-900",
  "from-yellow-500/15 to-neutral-900",
  "from-red-700/25 to-neutral-900",
];

export function BentoCategories({ categories }: { categories: Category[] }) {
  const tiles = categories.slice(0, 6);
  if (tiles.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-russo text-xs uppercase tracking-[0.3em] text-brand-red">
            Κατηγορίες
          </p>
          <h2 className="mt-2 font-russo text-3xl uppercase text-white md:text-5xl">
            Βρες ό,τι χρειάζεσαι
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:grid-rows-3">
        {tiles.map((c, i) => (
          <Link
            key={c.id}
            href={`/${c.slug}`}
            className={`group relative overflow-hidden rounded-2xl border border-neutral-800 ${TILE_CLASSES[i]}`}
          >
            {c.image_url ? (
              <Image
                src={c.image_url}
                alt={c.name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div
                className={`absolute inset-0 bg-gradient-to-br ${FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length]}`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-7">
              <h3 className="font-russo text-2xl uppercase leading-tight text-white md:text-3xl">
                {c.name}
              </h3>
              <span className="mt-2 inline-flex items-center gap-2 text-sm text-brand-red opacity-0 transition group-hover:opacity-100">
                Δες όλα
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </div>
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-transparent transition group-hover:ring-brand-red/40" />
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify in browser**

Reload localhost:3000. The bento grid should:
- Show 6 categories in a 3-col bento layout
- First tile is 2x2 (large)
- Last tile is 3x1 (wide)
- Each has gradient fallback if no image
- Hover: image zoom + red ring + "Δες όλα →" appears

- [ ] **Step 3: Commit**

```bash
git add src/components/home/bento-categories.tsx
git commit -m "feat(home): dark bento categories grid with gradient fallbacks"
```

---

## Phase 4 — Featured products

---

### Task 4.1: Rewrite FeaturedProducts as snap carousel

**Files:**
- Modify: `src/components/home/featured-products.tsx`

- [ ] **Step 1: Inspect existing**

Open the current file to know what props the parent passes.

- [ ] **Step 2: Rewrite**

Write `src/components/home/featured-products.tsx`:

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";

interface ProductCard {
  id: string;
  slug: string;
  name: string;
  brand: string;
  brand_slug: string;
  category_slug: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  primary_image_url: string;
  primary_image_alt: string;
  average_rating: number | null;
  review_count: number;
}

export function FeaturedProducts({ products }: { products: ProductCard[] }) {
  if (products.length === 0) return null;

  return (
    <section className="bg-[#0a0a0a] py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-russo text-xs uppercase tracking-[0.3em] text-brand-red">
              Featured
            </p>
            <h2 className="mt-2 font-russo text-3xl uppercase text-white md:text-5xl">
              Top προϊόντα
            </h2>
          </div>
          <Link
            href="/prosfores"
            className="hidden text-sm font-medium text-brand-red hover:underline md:block"
          >
            Όλες οι προσφορές →
          </Link>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:gap-6 md:px-0">
          {products.map((p) => {
            const discountPct =
              p.compare_at_price && p.compare_at_price > p.price
                ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)
                : null;
            const href = `/${p.category_slug || "prosfores"}/${p.slug}`;
            return (
              <Link
                key={p.id}
                href={href}
                className="group relative w-[240px] flex-shrink-0 snap-start overflow-hidden rounded-xl border border-neutral-800 bg-[#141414] transition hover:border-brand-red/40 md:w-[280px]"
              >
                <div className="relative aspect-square overflow-hidden bg-neutral-900">
                  {p.primary_image_url ? (
                    <Image
                      src={p.primary_image_url}
                      alt={p.primary_image_alt}
                      fill
                      sizes="280px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-neutral-600">
                      no image
                    </div>
                  )}
                  {discountPct !== null && (
                    <span className="absolute left-3 top-3 rounded-full bg-brand-red px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      -{discountPct}%
                    </span>
                  )}
                  <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition group-hover:opacity-100">
                    <button
                      aria-label="Wishlist"
                      className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-neutral-900 backdrop-blur transition hover:bg-white"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="Quick add"
                      className="grid h-9 w-9 place-items-center rounded-full bg-brand-red text-white transition hover:scale-105"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-red">
                    {p.brand}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-medium text-white">
                    {p.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-russo text-lg text-white">
                      €{p.price.toFixed(2)}
                    </span>
                    {p.compare_at_price && p.compare_at_price > p.price && (
                      <span className="text-xs text-neutral-500 line-through">
                        €{p.compare_at_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify in browser**

Reload. Featured products section should:
- Show 6 cards in horizontal scroll, scroll-snap aligning
- Each card has hover image zoom + revealed wishlist/cart buttons
- Discount badges if applicable
- Greek pricing

- [ ] **Step 4: Commit**

```bash
git add src/components/home/featured-products.tsx
git commit -m "feat(home): featured products as snap carousel with quick actions"
```

---

## Phase 5 — Brands marquee

---

### Task 5.1: Rewrite BrandsStrip as infinite marquee

**Files:**
- Modify: `src/components/home/brands-strip.tsx`
- Modify: `src/app/globals.css` (add marquee keyframes)

- [ ] **Step 1: Add CSS keyframes**

Append to `src/app/globals.css`:

```css
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.marquee-track {
  animation: marquee-scroll 60s linear infinite;
}
.marquee-track:hover {
  animation-play-state: paused;
}
```

- [ ] **Step 2: Replace component**

Write `src/components/home/brands-strip.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export function BrandsStrip({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;
  // Duplicate the list so the marquee loops seamlessly
  const loop = [...brands, ...brands];

  return (
    <section className="border-y border-neutral-800 bg-[#0a0a0a] py-10">
      <div className="container mx-auto px-4">
        <p className="mb-6 text-center font-russo text-xs uppercase tracking-[0.3em] text-brand-red">
          Brands που εμπιστευόμαστε
        </p>
      </div>
      <div className="overflow-hidden">
        <div className="marquee-track flex w-max items-center gap-8 px-4">
          {loop.map((b, i) => (
            <Link
              key={`${b.id}-${i}`}
              href={`/?brand=${b.slug}`}
              className="group flex h-14 w-32 flex-shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-[#141414] px-4 transition hover:border-brand-red/40 hover:bg-neutral-900"
              title={b.name}
            >
              {b.logo_url ? (
                <Image
                  src={b.logo_url}
                  alt={b.name}
                  width={96}
                  height={32}
                  className="max-h-8 w-auto opacity-70 transition group-hover:opacity-100"
                />
              ) : (
                <span className="font-russo text-xs uppercase tracking-wider text-neutral-400 group-hover:text-white">
                  {b.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify in browser**

Reload. Brands strip should:
- Marquee scrolls left infinitely
- Pauses on hover
- Each brand card has border, hover shows red border
- Names show as fallback when no logo

- [ ] **Step 4: Commit**

```bash
git add src/components/home/brands-strip.tsx src/app/globals.css
git commit -m "feat(home): brands strip infinite marquee with hover pause"
```

---

## Phase 6 — Product page gallery

---

### Task 6.1: Rewrite ImageGallery with vertical thumbs

**Files:**
- Modify: `src/components/product/image-gallery.tsx`

- [ ] **Step 1: Read existing**

Open `src/components/product/image-gallery.tsx` to capture the existing types and lightbox logic.

- [ ] **Step 2: Replace with vertical-thumbs layout**

Write `src/components/product/image-gallery.tsx`:

```tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/queries/products";

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

function Lightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: {
  images: ProductImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        onNavigate(Math.max(0, currentIndex - 1));
      if (e.key === "ArrowRight")
        onNavigate(Math.min(images.length - 1, currentIndex + 1));
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, onNavigate, currentIndex, images.length]);

  const img = images[currentIndex];
  if (!img) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4">
      <button
        onClick={onClose}
        className="absolute right-6 top-6 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <button
        onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
        disabled={currentIndex === 0}
        className="absolute left-6 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white disabled:opacity-30 hover:bg-white/20"
        aria-label="Previous"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={() => onNavigate(Math.min(images.length - 1, currentIndex + 1))}
        disabled={currentIndex === images.length - 1}
        className="absolute right-6 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white disabled:opacity-30 hover:bg-white/20"
        aria-label="Next"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      <div className="relative h-full max-h-[90vh] w-full max-w-6xl">
        <Image
          src={img.url}
          alt={img.alt}
          fill
          sizes="90vw"
          className="object-contain"
          priority
        />
      </div>
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/70">
        {currentIndex + 1} / {images.length}
      </p>
    </div>
  );
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const hasImages = images.length > 0;
  const current = hasImages ? (images[active] ?? images[0]) : null;
  const openLightbox = useCallback(() => setLightbox(true), []);

  return (
    <div className="flex flex-col gap-3 md:flex-row">
      {/* Vertical thumbs (desktop) / horizontal (mobile) — only shown if 2+ images */}
      {hasImages && images.length > 1 && (
      <div className="order-2 flex max-h-[480px] flex-row gap-2 overflow-x-auto md:order-1 md:flex-col md:overflow-y-auto">
        {images.map((img, i) => (
          <button
            key={img.url}
            onClick={() => setActive(i)}
            className={cn(
              "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 bg-neutral-100 transition md:h-20 md:w-20",
              i === active
                ? "border-brand-red"
                : "border-transparent hover:border-neutral-300",
            )}
            aria-label={`Image ${i + 1}`}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
      )}

      {/* Main image (or empty-state placeholder if product has no images) */}
      {current ? (
        <button
          onClick={openLightbox}
          className="order-1 relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-100 md:order-2 md:flex-1"
          aria-label="Open lightbox"
        >
          <Image
            src={current.url}
            alt={current.alt}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-contain transition-opacity duration-200"
            priority
          />
        </button>
      ) : (
        <div
          className="order-1 grid aspect-square w-full place-items-center rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 text-xs uppercase tracking-widest text-neutral-500 md:order-2 md:flex-1"
          aria-label="No image available"
        >
          {productName}
        </div>
      )}

      {lightbox && hasImages && (
        <Lightbox
          images={images}
          currentIndex={active}
          onClose={() => setLightbox(false)}
          onNavigate={setActive}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Navigate to a product with multiple images:
`http://localhost:3000/eksoplismos-anabath/kranh-endoep-nies-kameres/full-face/hjc000kra402`

Confirm:
- Vertical thumbs strip on left (desktop), horizontal on mobile
- Click thumb → main image swaps
- Click main image → lightbox opens
- Lightbox: arrow keys navigate, Escape closes, counter shows position

- [ ] **Step 4: Commit**

```bash
git add src/components/product/image-gallery.tsx
git commit -m "feat(product): vertical thumbs gallery with lightbox"
```

---

## Phase 7 — Product page sticky info

---

### Task 7.1: Sticky info panel on product page

**Files:**
- Modify: `src/app/[...path]/page.tsx`

- [ ] **Step 1: Find ProductView in the catch-all**

Open `src/app/[...path]/page.tsx`. Locate the `ProductView` async component (around line ~220).

- [ ] **Step 2: Replace its JSX block**

Within `ProductView`, replace the main grid:

```tsx
<div className="grid gap-8 lg:grid-cols-2">
  <ImageGallery images={product.images} productName={product.name} />

  <div className="space-y-5">
    ... existing content
  </div>
</div>
```

with:

```tsx
<div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
  <ImageGallery images={product.images} productName={product.name} />

  <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
    {product.brand && (
      <span className="inline-flex rounded-full bg-brand-red/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-red">
        {product.brand}
      </span>
    )}

    <h1 className="font-russo text-3xl uppercase leading-tight text-white lg:text-4xl">
      {product.name}
    </h1>

    {product.average_rating !== null && product.review_count > 0 && (
      <RatingStars
        rating={product.average_rating}
        reviewCount={product.review_count}
        size="md"
      />
    )}

    {product.certification && (
      <CertificationBadge certification={product.certification} />
    )}

    <div className="border-y border-neutral-800 py-4">
      <PriceDisplay
        price={product.price}
        compareAtPrice={product.compare_at_price}
        size="lg"
      />
      <KlarnaInfo price={product.price} />
    </div>

    {sizes.length > 0 && (
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Διαθέσιμα μεγέθη
        </p>
        <VariantSelector sizes={sizes} colors={[]} />
      </div>
    )}

    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
        Διαθεσιμότητα
      </p>
      <StockBadge stock={product.stock} />
    </div>

    <AddToCartButton
      productId={product.id}
      productName={product.name}
      unitPrice={product.price}
      stock={product.stock}
    />

    <DeliveryEstimate inStock={product.stock > 0} />

    {product.description && (
      <details className="border-t border-neutral-800 pt-4">
        <summary className="cursor-pointer text-sm font-bold uppercase tracking-wider text-white">
          Περιγραφή
        </summary>
        <p className="prose prose-sm prose-invert mt-3 max-w-none whitespace-pre-wrap">
          {product.description}
        </p>
      </details>
    )}
  </div>
</div>
```

- [ ] **Step 3: Verify in browser**

Navigate to: `http://localhost:3000/eksoplismos-anabath/kranh-endoep-nies-kameres/full-face/hjc000kra402`

Confirm:
- Left column: gallery (wider)
- Right column: sticky info that stays in view as you scroll
- Brand chip → name → rating → price block → variants → stock → CTA
- Description in a `<details>` accordion

- [ ] **Step 4: Commit**

```bash
git add src/app/[...path]/page.tsx
git commit -m "feat(product): sticky info panel with sectioned hierarchy"
```

---

## Phase 8 — Mobile sticky CTA

---

### Task 8.1: Bottom sticky add-to-cart bar on mobile

**Files:**
- Create: `src/components/product/mobile-cta-bar.tsx`
- Modify: `src/app/[...path]/page.tsx`

- [ ] **Step 1: Create mobile CTA component**

Write `src/components/product/mobile-cta-bar.tsx`:

```tsx
"use client";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { PriceDisplay } from "@/components/ui/price-display";

interface Props {
  productId: string;
  productName: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
}

export function MobileCtaBar(props: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-[#0a0a0a]/95 p-3 backdrop-blur lg:hidden">
      <div className="container mx-auto flex items-center gap-3">
        <div className="flex-shrink-0">
          <PriceDisplay
            price={props.price}
            compareAtPrice={props.compareAtPrice}
            size="md"
          />
        </div>
        <div className="flex-1">
          <AddToCartButton
            productId={props.productId}
            productName={props.productName}
            unitPrice={props.price}
            stock={props.stock}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into product view**

In `src/app/[...path]/page.tsx`, inside `ProductView`, after the existing `Suspense` wrapping `RelatedProductsSection`, add the mobile bar:

```tsx
import { MobileCtaBar } from "@/components/product/mobile-cta-bar";
```

Then at the bottom of `ProductView`'s `<main>` (just before `</main>`):

```tsx
<MobileCtaBar
  productId={product.id}
  productName={product.name}
  price={product.price}
  compareAtPrice={product.compare_at_price}
  stock={product.stock}
/>
```

- [ ] **Step 3: Add bottom padding to product main**

In the same file, change `<main className="container mx-auto px-4 py-6">` to:

```tsx
<main className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
```

(So the sticky bar doesn't cover content.)

- [ ] **Step 4: Verify on mobile size**

In dev tools, set viewport to 375x812 (iPhone X) and reload product page. The bar should:
- Stick to bottom
- Show price on left, full-width CTA on right
- Disappear at lg breakpoint (1024px+)

- [ ] **Step 5: Commit**

```bash
git add src/components/product/mobile-cta-bar.tsx src/app/[...path]/page.tsx
git commit -m "feat(product): mobile sticky bottom add-to-cart bar"
```

---

## Phase 9 — Performance & polish

---

### Task 9.1: Reduced-motion sanity check

**Files:** (no code changes if already handled)

- [ ] **Step 1: Verify behavior**

In dev tools, set "Emulate CSS prefers-reduced-motion" to "reduce". Reload homepage. Hero should:
- Show a static frame (the mid-frame, ~frame 60)
- All text overlays visible immediately (no scroll-fade)
- No animation on hover for cards (the test: bento tile hover should NOT zoom the image)

If hover transitions still play, scope them with `motion-safe:` Tailwind variants where appropriate. (Only do this if observation fails — Tailwind 4 should respect the media query in keyframes already.)

- [ ] **Step 2: Commit any changes** (if needed)

```bash
git commit -am "fix: respect prefers-reduced-motion in homepage animations"
```

---

### Task 9.2: Lighthouse audit

- [ ] **Step 1: Build for production**

```bash
pnpm build
pnpm start
```

- [ ] **Step 2: Run Lighthouse**

In Chrome DevTools, open Lighthouse, run Mobile + Desktop audits on:
- `http://localhost:3000/`
- `http://localhost:3000/eksoplismos-anabath/kranh-endoep-nies-kameres/full-face/hjc000kra402`

Record scores in `docs/superpowers/lighthouse-baseline.md`:

```markdown
# Lighthouse Baseline (post cinematic redesign)

Date: YYYY-MM-DD

| Page | LCP | FCP | CLS | TBT | Performance | Accessibility | Best Practices | SEO |
|------|-----|-----|-----|-----|-------------|---------------|----------------|-----|
| Home | ...s | ...s | ... | ...ms | 95 | 92 | 100 | 100 |
| Product | ...s | ...s | ... | ...ms | ... | ... | ... | ... |
```

- [ ] **Step 3: Commit baseline doc**

```bash
git add docs/superpowers/lighthouse-baseline.md
git commit -m "docs: lighthouse baseline post cinematic redesign"
```

- [ ] **Step 4: Fix any score below 85 (Performance)**

If LCP > 2.5s, identify worst image and lazy-load or compress further. Re-run Lighthouse. Repeat until ≥ 85.

---

### Task 9.3: Final visual review with user

- [ ] **Step 1: Run dev server**

```bash
pnpm dev
```

- [ ] **Step 2: User walkthrough**

Walk the user through:
1. Home: hero scroll → reveals headline → CTAs
2. Home: trust bar → bento → featured carousel → marquee
3. Click a product → check gallery + sticky info + variant + add-to-cart
4. Resize to mobile → check mobile CTA bar appears

- [ ] **Step 3: User confirms acceptance criteria**

From the spec section 10. The user verifies each ✓ checkbox and signs off.

- [ ] **Step 4: Tag the release**

```bash
git tag -a v0.2-cinematic -m "Cinematic redesign of home + product pages"
git push origin v0.2-cinematic   # only if user requests
```

(Do NOT push without explicit user approval.)

---

## Self-review notes

The plan covers each spec section:

- **§1 Direction** ↔ implicit in tasks 0.5–8.1 (dark cinematic styling everywhere)
- **§2 Design tokens** ↔ Task 5.1 adds CSS keyframes; otherwise tokens are reused as-is
- **§3.1 Hero** ↔ Tasks 0.1–0.6 (placeholder), 1.1–1.2 (real frames)
- **§3.2 TrustBar** ↔ Task 2.1
- **§3.3 BentoCategories** ↔ Task 3.1
- **§3.4 FeaturedProducts** ↔ Task 4.1
- **§3.5 BrandsStrip** ↔ Task 5.1
- **§3.6 ReviewsCarousel** ↔ KEEP from spec — already conditional `if reviews.length >= 3` in the existing component (skim once during user walkthrough)
- **§4 Product page** ↔ Tasks 6.1, 7.1
- **§5 Animation principles** ↔ baked into each component; reduced-motion verified in Task 9.1
- **§6 Performance budgets** ↔ Task 9.2 (Lighthouse audit)
- **§7 Out of scope** ↔ explicitly NOT implemented
- **§8 Dependencies** ↔ Vitest added in Task 0.1; ffmpeg expected as system dep
- **§9 Open questions/risks** ↔ Task 1.1 documents prompt iteration; gradient fallback handles missing images (Task 3.1)
- **§10 Acceptance** ↔ Task 9.3
