"use client";

import { useRef, useState } from "react";
import type { ProductListItem } from "@/lib/queries/products";
import { ProductRailCard } from "./product-rail-card";

export function ProductRailScroller({
  products,
}: {
  products: ProductListItem[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ startX: 0, startScroll: 0, moved: false });
  const [dragging, setDragging] = useState(false);

  function onPointerMove(e: PointerEvent) {
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 5) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - dx;
  }

  function onPointerUp() {
    setDragging(false);
    window.removeEventListener("pointermove", onPointerMove);
  }

  // Mouse drag-to-scroll on desktop; touch/pen keep native momentum scroll.
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = {
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    setDragging(true);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  }

  // Swallow the click that ends a drag so it doesn't navigate to a product.
  function onClickCapture(e: React.MouseEvent) {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }

  return (
    <div
      ref={trackRef}
      className={`v3-gallery-grid${dragging ? " is-dragging" : ""}`}
      onPointerDown={onPointerDown}
      onClickCapture={onClickCapture}
    >
      {products.map((p, i) => (
        <ProductRailCard key={p.id} product={p} rank={i + 1} />
      ))}
    </div>
  );
}
