"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="v3-acc-signout"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signOut();
        } finally {
          router.push("/");
          router.refresh();
        }
      }}
    >
      {busy ? "Αποσύνδεση…" : "Αποσύνδεση"}
    </button>
  );
}
