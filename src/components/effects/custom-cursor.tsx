"use client";

import { useEffect, useRef } from "react";

export const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const isTouchDevice = !window.matchMedia("(hover: hover)").matches;
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      pos.current.x += (mouse.current.x - pos.current.x) * 0.15;
      pos.current.y += (mouse.current.y - pos.current.y) * 0.15;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.current.x - 4}px, ${mouse.current.y - 4}px)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${pos.current.x - 16}px, ${pos.current.y - 16}px)`;
      }
      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    const raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden h-2 w-2 rounded-full bg-brand-teal mix-blend-screen md:block"
        style={{ willChange: "transform" }}
      />
      <div
        ref={glowRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] hidden h-8 w-8 rounded-full mix-blend-screen md:block"
        style={{
          willChange: "transform",
          background:
            "radial-gradient(circle, rgba(23,199,190,0.3) 0%, transparent 70%)",
        }}
      />
    </>
  );
};
