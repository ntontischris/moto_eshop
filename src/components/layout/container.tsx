import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const sizeMap = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
} as const;

export const Container = ({
  children,
  size = "lg",
  className,
}: ContainerProps) => (
  <div
    className={cn(
      "mx-auto w-full px-4 sm:px-6 lg:px-8",
      sizeMap[size],
      className,
    )}
  >
    {children}
  </div>
);
