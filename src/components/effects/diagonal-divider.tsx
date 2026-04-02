import { cn } from "@/lib/utils";

interface DiagonalDividerProps {
  direction?: "left" | "right";
  className?: string;
  color?: string;
}

export const DiagonalDivider = ({
  direction = "left",
  className,
  color = "var(--bg-surface)",
}: DiagonalDividerProps) => (
  <div
    className={cn("relative -mt-8 h-16 w-full md:-mt-12 md:h-24", className)}
    style={{
      clipPath:
        direction === "left"
          ? "polygon(0 0, 100% 60%, 100% 100%, 0 100%)"
          : "polygon(0 60%, 100% 0, 100% 100%, 0 100%)",
      backgroundColor: color,
    }}
  />
);
