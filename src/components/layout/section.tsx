import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  spacing?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const spacingMap = {
  sm: "py-8 sm:py-12",
  md: "py-12 sm:py-16",
  lg: "py-16 sm:py-24",
  xl: "py-24 sm:py-32",
} as const;

export const Section = ({
  children,
  spacing = "lg",
  className,
}: SectionProps) => (
  <section className={cn(spacingMap[spacing], className)}>{children}</section>
);
