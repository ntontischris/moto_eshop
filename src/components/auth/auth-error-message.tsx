import { AlertCircle } from "lucide-react";

interface AuthErrorMessageProps {
  message: string | null;
}

export function AuthErrorMessage({ message }: AuthErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
