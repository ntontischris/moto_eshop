"use client";

import { useTranslations } from "next-intl";
import { useV3 } from "../shell/v3-provider";

export function WishlistButton({ slug }: { slug: string }) {
  const t = useTranslations("auth");
  const { wishlist, toggleWishlist } = useV3();
  const active = wishlist.includes(slug);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(slug);
      }}
      aria-pressed={active}
      aria-label={active ? t("wishlistRemove") : t("wishlistAdd")}
      style={{
        position: "absolute",
        top: "8px",
        right: "8px",
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(14,16,20,0.72)",
        backdropFilter: "blur(6px)",
        cursor: "pointer",
        color: active ? "var(--v3-red)" : "var(--v3-bone-dim)",
        transition: "color .15s, border-color .15s",
        padding: 0,
      }}
    >
      {/* Heart SVG — filled when active, outline when not */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
