import { cn } from "@/lib/utils";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

export const H1 = ({ children, className }: TypographyProps) => (
  <h1
    className={cn("text-4xl font-black tracking-tight lg:text-5xl", className)}
  >
    {children}
  </h1>
);

export const H2 = ({ children, className }: TypographyProps) => (
  <h2 className={cn("text-3xl font-bold tracking-tight", className)}>
    {children}
  </h2>
);

export const H3 = ({ children, className }: TypographyProps) => (
  <h3 className={cn("text-2xl font-semibold tracking-tight", className)}>
    {children}
  </h3>
);

export const H4 = ({ children, className }: TypographyProps) => (
  <h4 className={cn("text-xl font-semibold tracking-tight", className)}>
    {children}
  </h4>
);

export const Lead = ({ children, className }: TypographyProps) => (
  <p className={cn("text-xl text-muted-foreground", className)}>{children}</p>
);

export const Large = ({ children, className }: TypographyProps) => (
  <p className={cn("text-lg font-semibold", className)}>{children}</p>
);

export const Small = ({ children, className }: TypographyProps) => (
  <small className={cn("text-sm font-medium leading-none", className)}>
    {children}
  </small>
);

export const Muted = ({ children, className }: TypographyProps) => (
  <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
);

export const SectionLabel = ({ children, className }: TypographyProps) => (
  <p
    className={cn(
      "text-sm font-bold tracking-[0.2em] uppercase text-brand-red",
      className,
    )}
  >
    {children}
  </p>
);
