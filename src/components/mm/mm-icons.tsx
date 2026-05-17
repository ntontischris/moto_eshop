/* Inline SVG icons — Moto Market design system */
import type { SVGProps } from "react";

export const IconArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
    <path
      d="M2.5 8h11M9 3.5L13.5 8 9 12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
  </svg>
);

export const IconArrowUpRight = (p: SVGProps<SVGSVGElement>) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
    <path
      d="M4 12L12 4M12 4H6M12 4V10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
  </svg>
);

export const IconChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" {...p}>
    <path
      d="M3 4.5L6 7.5L9 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
  </svg>
);

export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" {...p}>
    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M14 14L17 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
  </svg>
);

export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" {...p}>
    <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M3.5 17C4 13.5 6.5 12 10 12C13.5 12 16 13.5 16.5 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
  </svg>
);

export const IconHeart = ({
  filled,
  ...p
}: SVGProps<SVGSVGElement> & { filled?: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill={filled ? "currentColor" : "none"}
    {...p}
  >
    <path
      d="M10 17.5l-1.2-1.1C5 13 2.5 10.7 2.5 7.9 2.5 5.6 4.3 3.8 6.6 3.8c1.3 0 2.5.6 3.4 1.6.9-1 2.1-1.6 3.4-1.6 2.3 0 4.1 1.8 4.1 4.1 0 2.8-2.5 5.1-6.3 8.5L10 17.5z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

export const IconCart = (p: SVGProps<SVGSVGElement>) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" {...p}>
    <path
      d="M3 4h2l2 10h9l2-7H6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
    <circle cx="9" cy="17" r="1" fill="currentColor" />
    <circle cx="15" cy="17" r="1" fill="currentColor" />
  </svg>
);

export const IconInsta = (p: SVGProps<SVGSVGElement>) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" {...p}>
    <rect
      x="3"
      y="3"
      width="14"
      height="14"
      rx="4"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="14.5" cy="5.5" r="0.8" fill="currentColor" />
  </svg>
);

export const IconFacebook = (p: SVGProps<SVGSVGElement>) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" {...p}>
    <path
      d="M12 7h2V4h-2c-1.7 0-3 1.3-3 3v2H7v3h2v6h3v-6h2l1-3h-3V7.5c0-.3.2-.5.5-.5z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

export const IconYouTube = (p: SVGProps<SVGSVGElement>) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" {...p}>
    <rect
      x="2"
      y="5"
      width="16"
      height="10"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M8.5 8L13 10L8.5 12V8Z" fill="currentColor" />
  </svg>
);
