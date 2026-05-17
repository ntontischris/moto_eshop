import type { ReactNode } from "react";

export interface HeroCCta {
  label: string;
  href: string;
  variant?: "primary" | "ghost";
}

export interface HeroCBeat {
  range: [number, number];
  position: "center" | "left" | "right";
  eyebrow: string;
  title: ReactNode;
  body: string;
  ctas: HeroCCta[];
}

/** Per-beat scene colors driving fog, lights, particles. */
export interface HeroCMood {
  fog: [number, number, number];
  key: [number, number, number];
  rim: [number, number, number];
  ambient: number;
  particleSpeed: number;
  fov: number;
  cameraZ: number;
}

export const HERO_C_MOODS: HeroCMood[] = [
  // 0 — intro: dark, central spotlight, slow push
  {
    fog: [0.02, 0.02, 0.04],
    key: [1.0, 0.95, 0.85],
    rim: [0.85, 0.12, 0.12],
    ambient: 0.05,
    particleSpeed: 0.35,
    fov: 42,
    cameraZ: 8,
  },
  // 1 — city lights: cool blue/neon
  {
    fog: [0.02, 0.05, 0.12],
    key: [0.45, 0.7, 1.0],
    rim: [0.95, 0.25, 0.45],
    ambient: 0.08,
    particleSpeed: 0.9,
    fov: 48,
    cameraZ: 6,
  },
  // 2 — race day: warm amber + red rim
  {
    fog: [0.08, 0.03, 0.02],
    key: [1.0, 0.55, 0.18],
    rim: [1.0, 0.15, 0.08],
    ambient: 0.06,
    particleSpeed: 1.6,
    fov: 56,
    cameraZ: 5,
  },
  // 3 — open road: teal/orange horizon
  {
    fog: [0.04, 0.07, 0.08],
    key: [1.0, 0.6, 0.3],
    rim: [0.2, 0.85, 0.85],
    ambient: 0.1,
    particleSpeed: 0.5,
    fov: 64,
    cameraZ: 9,
  },
  // 4 — crafted: near black, single warm spotlight
  {
    fog: [0.015, 0.012, 0.01],
    key: [1.0, 0.78, 0.4],
    rim: [0.55, 0.08, 0.02],
    ambient: 0.04,
    particleSpeed: 0.18,
    fov: 36,
    cameraZ: 4.5,
  },
];

export const HERO_C_RANGES: Array<[number, number]> = [
  [0.0, 0.18],
  [0.2, 0.38],
  [0.4, 0.58],
  [0.6, 0.78],
  [0.8, 0.98],
];

/** Clamp helper. */
export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Fade opacity for a beat's panel based on global progress. */
export function beatOpacity(
  progress: number,
  [start, end]: [number, number],
): number {
  const FADE = 0.04;
  const fadeIn = clamp01((progress - start) / FADE);
  const fadeOut = 1 - clamp01((progress - (end - FADE)) / FADE);
  return clamp01(fadeIn * fadeOut);
}

/**
 * Compute the active beat index + sub-progress (0..1 within that beat)
 * and a smooth blend factor between adjacent beats for the 3D scene.
 */
export function moodForProgress(progress: number): {
  index: number;
  next: number;
  t: number;
} {
  // Map global progress 0..1 to a continuous 0..4 across the 5 beats.
  const scaled = clamp01(progress) * (HERO_C_MOODS.length - 1);
  const index = Math.min(Math.floor(scaled), HERO_C_MOODS.length - 1);
  const next = Math.min(index + 1, HERO_C_MOODS.length - 1);
  const t = clamp01(scaled - index);
  return { index, next, t };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerp3(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
