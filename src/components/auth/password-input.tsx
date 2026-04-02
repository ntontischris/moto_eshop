"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { InputHTMLAttributes } from "react";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function PasswordInput({
  label = "Κωδικός",
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <Input
          {...props}
          type={isVisible ? "text" : "password"}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
          onClick={() => setIsVisible((v) => !v)}
          aria-label={isVisible ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
