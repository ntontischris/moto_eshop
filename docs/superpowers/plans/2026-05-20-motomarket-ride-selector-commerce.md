# MotoMarket Ride Selector Commerce Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the storefront homepage into an Alpinestars-inspired, activity-first premium motorcycle commerce experience.

**Architecture:** Keep the existing Next.js `(store)` shell, but replace the first-viewport commerce structure with a fast static hero, a ride/activity selector, a functional mega menu, and clearer product cards. Styling remains CSS/token based so the page keeps Core Web Vitals discipline.

**Tech Stack:** Next.js App Router, React server/client components, CSS modules via global store stylesheet, lucide-react icons, existing product query APIs.

---

### Task 1: Homepage Structure

**Files:**
- Modify: `src/app/(store)/page.tsx`
- Modify: `src/app/(store)/_components/home/hero.tsx`
- Modify: `src/app/(store)/_components/home/race-control-panel.tsx`
- Modify: `src/app/(store)/_components/home/category-shortcut-grid.tsx`

- [ ] Replace generic racing copy with activity-first MotoMarket commerce copy.
- [ ] Add ride modes: Racing, Adventure, Urban, Touring, Off-road, Rain/Winter, Parts, Offers.
- [ ] Keep hero image static and LCP-friendly.
- [ ] Ensure mobile hero content stacks without cropping the core subject.

### Task 2: Navigation And Mega Menu

**Files:**
- Modify: `src/app/(store)/_components/shell/header.tsx`
- Modify: `src/app/(store)/_components/shell/mega-menu.tsx`

- [ ] Make the header compact and transactional: logo, search, offers, mode, cart.
- [ ] Make mega menu columns map to buyer intent: activity, gear, bike, brands, deals.
- [ ] Keep menu accessible by hover, focus, and click.

### Task 3: Product Cards And Rails

**Files:**
- Modify: `src/app/(store)/_components/commerce/product-card.tsx`
- Modify: `src/app/(store)/_components/home/product-rail.tsx`
- Modify: `src/app/(store)/_components/home/offers-section.tsx`

- [ ] Rebuild cards as clean commerce cards with image, brand, stock, badges, price, CTA.
- [ ] Reduce decorative noise around product rails.
- [ ] Keep horizontal rails stable and scrollable on mobile.

### Task 4: Visual System

**Files:**
- Modify: `src/app/(store)/_styles/components.css`

- [ ] Add final override layer for dark and light modes.
- [ ] Use red/black racing tension in dark mode and clean white premium commerce in light mode.
- [ ] Keep cards at 8px radius or less where practical.
- [ ] Avoid heavy animation in the first viewport.

### Task 5: Verification

**Commands:**
- `npx tsc --noEmit`
- `npm run lint -- src/app/(store)/page.tsx src/app/(store)/_components/home/hero.tsx src/app/(store)/_components/shell/mega-menu.tsx src/app/(store)/_components/commerce/product-card.tsx`

- [ ] Confirm TypeScript passes.
- [ ] Confirm targeted lint passes or report existing unrelated lint debt.
- [ ] Inspect `http://127.0.0.1:3000/` in the browser for desktop and mobile layout.
