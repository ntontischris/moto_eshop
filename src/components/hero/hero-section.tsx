"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

interface BannerSlide {
  id: number;
  brand: string;
  headline: string;
  tagline: string;
  ctaLabel: string;
  ctaHref: string;
  gradient: string;
  accentColor: string;
  brandBg: string;
}

const slides: BannerSlide[] = [
  {
    id: 1,
    brand: "AGV",
    headline: "ΑΣΦΑΛΕΙΑ ΣΕ ΚΑΘΕ ΣΤΡΟΦΗ",
    tagline: "Κράνη επαγγελματικής απόδοσης",
    ctaLabel: "Δες τα Κράνη AGV",
    ctaHref: "/kranea",
    gradient: "linear-gradient(135deg, #0B0F14 0%, #0F1A28 40%, #0D1520 100%)",
    accentColor: "text-brand-teal",
    brandBg: "bg-brand-teal/10 border border-brand-teal/20",
  },
  {
    id: 2,
    brand: "Dainese",
    headline: "ΠΡΟΣΤΑΣΙΑ ΧΩΡΙΣ ΣΥΜΒΙΒΑΣΜΟΥΣ",
    tagline: "Επαγγελματικός εξοπλισμός αναβατών",
    ctaLabel: "Δες Εξοπλισμό",
    ctaHref: "/shop",
    gradient: "linear-gradient(135deg, #120B0B 0%, #1F0D0D 40%, #160B0B 100%)",
    accentColor: "text-brand-red",
    brandBg: "bg-brand-red/10 border border-brand-red/20",
  },
  {
    id: 3,
    brand: "Alpinestars",
    headline: "ΟΔΗΓΗΣΕ ΧΩΡΙΣ ΟΡΙΑ",
    tagline: "Γάντια, μπότες & ένδυση υψηλών επιδόσεων",
    ctaLabel: "Εξερεύνησε",
    ctaHref: "/shop",
    gradient: "linear-gradient(135deg, #0A0F0A 0%, #0D1A10 40%, #0B150C 100%)",
    accentColor: "text-emerald-400",
    brandBg: "bg-emerald-400/10 border border-emerald-400/20",
  },
  {
    id: 4,
    brand: "Shoei",
    headline: "ΤΕΧΝΟΛΟΓΙΑ ΠΡΩΤΟΠΟΡΩΝ",
    tagline: "Κράνη ιαπωνικής μηχανικής αριστείας",
    ctaLabel: "Δες τα Κράνη Shoei",
    ctaHref: "/kranea",
    gradient: "linear-gradient(135deg, #0F0B14 0%, #180D28 40%, #130C1E 100%)",
    accentColor: "text-violet-400",
    brandBg: "bg-violet-400/10 border border-violet-400/20",
  },
  {
    id: 5,
    brand: "Rev'It",
    headline: "ΣΤΥΛ ΚΑΙ ΛΕΙΤΟΥΡΓΙΚΟΤΗΤΑ",
    tagline: "Η νέα κολεξιόν έφτασε",
    ctaLabel: "Νέες Αφίξεις",
    ctaHref: "/prosfores",
    gradient: "linear-gradient(135deg, #0F0F0B 0%, #1A1A0D 40%, #151508 100%)",
    accentColor: "text-amber-400",
    brandBg: "bg-amber-400/10 border border-amber-400/20",
  },
];

const AUTOPLAY_INTERVAL = 5000;

export const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, []);

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToIndex = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goToNext, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, goToNext]);

  const activeSlide = slides[activeIndex];

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
          style={{ background: activeSlide.gradient }}
          initial={{ opacity: 0 }}
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
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className="flex flex-col gap-4"
              >
                {/* Brand badge */}
                <span
                  className={`inline-flex w-fit items-center rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-widest ${activeSlide.brandBg} ${activeSlide.accentColor}`}
                >
                  {activeSlide.brand}
                </span>

                {/* Headline */}
                <h1 className="font-display text-3xl tracking-wider text-text-primary md:text-4xl lg:text-5xl xl:text-6xl">
                  {activeSlide.headline}
                </h1>

                {/* Tagline */}
                <p className="text-base text-text-chrome md:text-lg">
                  {activeSlide.tagline}
                </p>

                {/* CTA */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    className="bg-brand-teal text-white hover:bg-brand-teal-hover"
                    render={<Link href={activeSlide.ctaHref} />}
                  >
                    {activeSlide.ctaLabel}
                  </Button>
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
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
            >
              <div
                className={`flex h-52 w-72 items-center justify-center rounded-2xl lg:h-64 lg:w-88 ${activeSlide.brandBg}`}
              >
                <span
                  className={`font-display text-5xl font-bold tracking-widest lg:text-6xl ${activeSlide.accentColor} opacity-60`}
                >
                  {activeSlide.brand}
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
