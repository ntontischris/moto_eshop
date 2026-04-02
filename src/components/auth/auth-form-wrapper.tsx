import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AuthFormWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthFormWrapper({
  title,
  subtitle,
  children,
}: AuthFormWrapperProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 pb-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent className="pt-4">{children}</CardContent>
      </Card>
    </div>
  );
}
