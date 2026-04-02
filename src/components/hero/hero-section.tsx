"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

const ParticleCanvas = dynamic(
  () =>
    import("@/components/hero/particle-canvas").then(
      (mod) => mod.ParticleCanvas,
    ),
  { ssr: false },
);

const headlineChars = "ΕΞΟΠΛΙΣΜΟΣ ΜΟΤΟΣΥΚΛΕΤΑΣ";
const subHeadlineChars = "ΓΙΑ ΚΑΘΕ ΑΝΑΒΑΤΗ";

const CharReveal = ({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) => (
  <span className={className} aria-label={text}>
    {text.split("").map((char, i) => (
      <motion.span
        key={`${char}-${i}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + i * 0.04, duration: 0.3 }}
        className="inline-block"
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ))}
  </span>
);

export const HeroSection = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(window.matchMedia("(min-width: 768px)").matches);
  }, []);

  return (
    <section
      className="relative flex h-[50vh] items-center overflow-hidden md:h-[60vh]"
      style={{
        background: isDesktop
          ? "transparent"
          : "radial-gradient(ellipse at 30% 50%, rgba(220,38,38,0.12) 0%, transparent 60%), linear-gradient(135deg, #0B0F14 0%, #141A23 100%)",
      }}
    >
      {isDesktop && <ParticleCanvas />}

      <Container>
        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <h1 className="font-display text-4xl tracking-wider text-text-primary md:text-5xl lg:text-6xl xl:text-7xl">
            <CharReveal text={headlineChars} />
            <br />
            <CharReveal
              text={subHeadlineChars}
              className="text-brand-red"
              delay={headlineChars.length * 0.04}
            />
          </h1>

          <motion.p
            className="max-w-xl text-lg text-text-chrome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.6 }}
          >
            Ανακάλυψε χιλιάδες προϊόντα από τις κορυφαίες μάρκες παγκοσμίως.
            Δωρεάν αποστολή για αγορές άνω των 80€.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.1, duration: 0.5 }}
          >
            <Button size="lg" render={<Link href="/kranea" />}>
              Δες τα Κράνη
            </Button>
            <Button
              size="lg"
              variant="brand-outline"
              render={<Link href="/prosfores" />}
            >
              Προσφορές
            </Button>
          </motion.div>
        </div>
      </Container>

      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="h-6 w-6 text-text-muted" />
      </motion.div>
    </section>
  );
};
