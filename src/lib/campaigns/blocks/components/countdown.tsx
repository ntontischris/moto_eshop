"use client";

import { useEffect, useState } from "react";
import type { Block } from "../schema";

type Countdown = Extract<Block, { type: "countdown" }>;

function remaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export function CountdownBlock({ block }: { block: Countdown }) {
  const target = new Date(block.targetAt).getTime();
  const [t, setT] = useState(() => remaining(target));

  useEffect(() => {
    const id = setInterval(() => setT(remaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <section className="container mx-auto px-4 py-10 text-center">
      {block.title && (
        <h2 className="mb-4 font-russo text-2xl uppercase text-white">
          {block.title}
        </h2>
      )}
      <div className="flex items-center justify-center gap-4 font-russo text-3xl text-brand-red">
        <span>{t.d}d</span>
        <span>{t.h}h</span>
        <span>{t.m}m</span>
        <span>{t.s}s</span>
      </div>
    </section>
  );
}
