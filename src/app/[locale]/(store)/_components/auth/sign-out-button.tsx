"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "@/lib/auth/actions";

export function SignOutButton() {
  const t = useTranslations("auth");
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
      {busy ? t("signOutBusy") : t("signOut")}
    </button>
  );
}
