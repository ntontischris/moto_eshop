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
  const down = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const moved = useRef(false);
  const [dragging, setDragging] = useState(false);

  // Mouse drag-to-scroll. Touch/pen keep native momentum scrolling.
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    down.current = true;
    moved.current = false;
    startX.current = e.clientX;
    startScroll.current = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
    setDragging(true);
  }

  // Only scrolls while the button is actually held (down.current). Once
  // released, moving the mouse does nothing.
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!down.current) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 5) moved.current = true;
    el.scrollLeft = startScroll.current - dx;
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!down.current) return;
    down.current = false;
    setDragging(false);
    const el = trackRef.current;
    if (el?.hasPointerCapture(e.pointerId))
      el.releasePointerCapture(e.pointerId);
  }

  // Swallow the click that ends a drag so it doesn't open a product.
  function onClickCapture(e: React.MouseEvent) {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  }

  return (
    <div
      ref={trackRef}
      className={`v3-gallery-grid${dragging ? " is-dragging" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      {products.map((p, i) => (
        <ProductRailCard key={p.id} product={p} rank={i + 1} />
      ))}
    </div>
  );
}
