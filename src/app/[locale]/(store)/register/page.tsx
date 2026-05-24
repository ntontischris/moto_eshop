import { Suspense } from "react";
import RegisterClient from "./register-client";

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterClient />
    </Suspense>
  );
}

function RegisterFallback() {
  return (
    <div className="v3-auth" aria-hidden="true">
      <div className="h-10 w-56 rounded bg-white/10" />
      <div className="mt-6 h-72 rounded bg-white/10" />
    </div>
  );
}
