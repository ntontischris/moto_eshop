"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string | null;
  gradient: string | null;
  accent_color: string | null;
  position: number;
}

const ACCENT_STYLES: Record<string, { text: string; bg: string }> = {
  teal: {
    text: "text-brand-teal",
    bg: "bg-brand-teal/10 border border-brand-teal/20",
  },
  red: {
    text: "text-brand-red",
    bg: "bg-brand-red/10 border border-brand-red/20",
  },
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-400/10 border border-emerald-400/20",
  },
  violet: {
    text: "text-violet-400",
    bg: "bg-violet-400/10 border border-violet-400/20",
  },
  amber: {
    text: "text-amber-400",
    bg: "bg-amber-400/10 border border-amber-400/20",
  },
};

const DEFAULT_ACCENT = {
  text: "text-brand-teal",
  bg: "bg-brand-teal/10 border border-brand-teal/20",
};

const AUTOPLAY_INTERVAL = 5000;

interface HeroSectionProps {
  slides: BannerSlide[];
}

export const HeroSection = ({ slides }: HeroSectionProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const goToNext = useCallback(() => {
    setHasInteracted(true);
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    setHasInteracted(true);
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToIndex = useCallback((index: number) => {
    setHasInteracted(true);
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goToNext, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, goToNext]);

  if (slides.length === 0) return null;

  const activeSlide = slides[activeIndex];

  if (!activeSlide) return null;

  const accent =
    ACCENT_STYLES[activeSlide.accent_color ?? "teal"] ?? DEFAULT_ACCENT;

  return (
    <section
      className="relative flex h-[50vh] items-center overflow-hidden md:h-[60vh]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background gradient (animated per slide) */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${activeSlide.id}`}
          className="absolute inset-0"
          style={{
            background:
              activeSlide.gradient ??
              "linear-gradient(135deg, #0B0F14 0%, #0F1A28 40%, #0D1520 100%)",
          }}
          initial={hasInteracted ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      </AnimatePresence>

      {/* Subtle decorative grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Slide content */}
      <Container className="relative z-10">
        <div className="flex items-center justify-between gap-8">
          {/* Text content */}
          <div className="flex flex-1 flex-col gap-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${activeSlide.id}`}
                initial={hasInteracted ? { opacity: 0, x: -24 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className="flex flex-col gap-4"
              >
                {/* Brand badge */}
                <span
                  className={`inline-flex w-fit items-center rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-widest ${accent.bg} ${accent.text}`}
                >
                  {activeSlide.title}
                </span>

                {/* Headline */}
                <h1 className="font-display text-3xl tracking-wider text-text-primary md:text-4xl lg:text-5xl xl:text-6xl">
                  {activeSlide.title}
                </h1>

                {/* Tagline */}
                {activeSlide.subtitle && (
                  <p className="text-base text-text-chrome md:text-lg">
                    {activeSlide.subtitle}
                  </p>
                )}

                {/* CTA */}
                <div className="flex flex-wrap items-center gap-3">
                  {activeSlide.cta_href && activeSlide.cta_label && (
                    <Button
                      size="lg"
                      className="bg-brand-teal text-white hover:bg-brand-teal-hover"
                      render={<Link href={activeSlide.cta_href} />}
                    >
                      {activeSlide.cta_label}
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="brand-outline"
                    render={<Link href="/prosfores" />}
                  >
                    Προσφορές
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Brand image placeholder (desktop only) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`img-${activeSlide.id}`}
              className="hidden shrink-0 md:flex"
              initial={hasInteracted ? { opacity: 0, scale: 0.92 } : false}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
            >
              <div
                className={`flex h-52 w-72 items-center justify-center rounded-2xl lg:h-64 lg:w-88 ${accent.bg}`}
              >
                <span
                  className={`font-display text-5xl font-bold tracking-widest lg:text-6xl ${accent.text} opacity-60`}
                >
                  {activeSlide.title}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>

      {/* Left arrow */}
      <button
        onClick={goToPrev}
        aria-label="Προηγούμενο slide"
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50 md:left-5"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Right arrow */}
      <button
        onClick={goToNext}
        aria-label="Επόμενο slide"
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50 md:right-5"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToIndex(index)}
            aria-label={`Μετάβαση στο slide ${index + 1}`}
            className="group relative flex items-center"
          >
            <span
              className={`block h-2 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "w-6 bg-brand-teal"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
};
