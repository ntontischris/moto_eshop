import { Suspense } from "react";
import LoginClient from "./login-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="v3-auth" aria-hidden="true">
      <div className="h-10 w-48 rounded bg-white/10" />
      <div className="mt-6 h-64 rounded bg-white/10" />
    </div>
  );
}
