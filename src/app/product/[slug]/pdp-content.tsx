"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ProductCard, SectionHeader, useMM } from "@/components/mm/mm-shell";
import type { Product as MMProduct } from "@/components/mm/mm-shell";
import type { Product, ProductListItem } from "@/lib/queries/products";

export function PDPContent({
  product,
  related,
}: {
  product: Product;
  related: ProductListItem[];
}) {
  const { lang, t, addToCart, toggleWish, wishlist } = useMM();
  const [activeImg, setActiveImg] = useState(0);
  const [openTab, setOpenTab] = useState<"specs" | "desc" | "shipping">(
    "specs",
  );

  const isWished = wishlist.includes(product.slug);
  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  const specEntries = Object.entries(product.specs ?? {});

  /* Map to MMShell Product shape so addToCart accepts it */
  const asCartProduct: MMProduct = {
    id: product.slug,
    brand: product.brand,
    el: { name: product.name, cat: product.category_name },
    en: { name: product.name, cat: product.category_name },
    price: product.price,
    oldPrice: product.compare_at_price ?? undefined,
    isSale: discount > 0,
    img: product.images[0]?.url ?? "",
  };

  const toCardProduct = (p: ProductListItem): MMProduct => {
    const old = p.compare_at_price ?? undefined;
    return {
      id: p.slug,
      brand: p.brand,
      el: { name: p.name, cat: p.category_slug },
      en: { name: p.name, cat: p.category_slug },
      price: p.price,
      oldPrice: old,
      isSale: !!old && old > p.price,
      img: p.primary_image_url,
    };
  };

  return (
    <>
      <style>{`
        .pdp { padding: 24px 0 0; }
        .pdp__crumb { display: flex; gap: 8px; align-items: center; font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); padding-block: 12px; flex-wrap: wrap; }
        .pdp__crumb a:hover { color: var(--bone); }
        .pdp__crumb .sep { opacity: 0.5; }
        .pdp__crumb .here { color: var(--bone); }
        .pdp__layout { display: grid; grid-template-columns: 1.2fr 1fr; gap: 56px; margin-top: 16px; }
        @media (max-width: 1000px) { .pdp__layout { grid-template-columns: 1fr; gap: 32px; } }
        .pdp__gallery { display: flex; flex-direction: column; gap: 12px; }
        .pdp__main { position: relative; aspect-ratio: 4/5; background: var(--ink-2); border: 1px solid var(--hair); overflow: hidden; }
        .pdp__main img { width: 100%; height: 100%; object-fit: cover; }
        .pdp__main .b { position: absolute; top: 16px; left: 16px; display: flex; gap: 6px; }
        .pdp__main .b span { font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; padding: 5px 10px; font-weight: 700; }
        .pdp__main .b .sale { background: var(--accent); color: white; }
        .pdp__main .b .new { background: var(--bone); color: var(--ink); }
        .pdp__main .b .oos { background: var(--muted-2); color: var(--bone); }
        .pdp__thumbs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .pdp__thumb { position: relative; aspect-ratio: 1; background: var(--ink-2); border: 1px solid var(--hair); overflow: hidden; cursor: pointer; transition: border-color 180ms var(--ease); }
        .pdp__thumb.is-active { border-color: var(--accent); }
        .pdp__thumb img { width: 100%; height: 100%; object-fit: cover; }
        .pdp__buy { position: sticky; top: 120px; align-self: start; display: flex; flex-direction: column; gap: 18px; }
        @media (max-width: 1000px) { .pdp__buy { position: static; } }
        .pdp__brand { font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
        .pdp__name { font-family: var(--display); font-weight: 800; font-size: clamp(28px, 4vw, 44px); line-height: 1; letter-spacing: -0.01em; text-transform: uppercase; margin: 0; }
        .pdp__rating { display: flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 11px; color: var(--muted); flex-wrap: wrap; }
        .pdp__rating .stars { color: var(--accent); }
        .pdp__price { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; padding-block: 8px; border-block: 1px solid var(--hair); }
        .pdp__price .now { font-family: var(--display); font-weight: 800; font-size: 38px; line-height: 1; }
        .pdp__price .old { font-family: var(--mono); font-size: 14px; color: var(--muted); text-decoration: line-through; }
        .pdp__price .save { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; color: var(--accent); font-weight: 700; background: rgba(232,65,42,0.12); padding: 4px 8px; }
        [data-mode="light"] .pdp__price .save { background: rgba(200,52,31,0.1); }
        .pdp__cta { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-top: 8px; }
        .pdp__cta .add { background: var(--accent); color: white; font-family: var(--mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; padding: 18px 24px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: all 180ms var(--ease); border-radius: 4px; border: 0; }
        .pdp__cta .add:hover:not(:disabled) { background: #ff5538; transform: translateY(-1px); }
        .pdp__cta .add:disabled { opacity: 0.4; cursor: not-allowed; }
        .pdp__cta .wish { width: 56px; height: 56px; background: transparent; border: 1px solid var(--hair-strong); color: var(--bone); display: grid; place-items: center; cursor: pointer; transition: all 180ms var(--ease); border-radius: 4px; font-size: 20px; }
        .pdp__cta .wish:hover, .pdp__cta .wish.is-on { background: var(--accent); color: white; border-color: var(--accent); }
        .pdp__signals { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px 0; border-top: 1px solid var(--hair); font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
        .pdp__signals .s { display: flex; align-items: center; gap: 6px; }
        .pdp__signals .s strong { color: var(--bone); font-weight: 600; }
        .pdp__signals .dotg { width: 6px; height: 6px; background: var(--green); border-radius: 50%; }
        .pdp__signals .dotr { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
        .pdp__trust { display: grid; gap: 6px; padding: 14px 0; border-top: 1px solid var(--hair); font-size: 13px; color: var(--muted); }
        .pdp__trust .row { display: flex; align-items: center; gap: 8px; }
        .pdp__trust .row strong { color: var(--bone); font-weight: 500; }
        .pdp__tabs { margin-top: 56px; border-top: 1px solid var(--hair); }
        .pdp__tabs-nav { display: flex; gap: 32px; border-bottom: 1px solid var(--hair); padding-bottom: 0; overflow-x: auto; }
        .pdp__tabs-nav button { padding: 18px 0; font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 600; color: var(--muted); position: relative; cursor: pointer; transition: color 180ms var(--ease); white-space: nowrap; background: transparent; border: 0; }
        .pdp__tabs-nav button.is-on { color: var(--bone); }
        .pdp__tabs-nav button.is-on::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--accent); }
        .pdp__tab { padding: 32px 0; max-width: 760px; }
        .pdp__specs { display: grid; gap: 0; }
        .pdp__specs > div { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--hair); font-size: 14px; }
        .pdp__specs > div:last-child { border-bottom: 0; }
        .pdp__specs > div span:first-child { font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
        .pdp__specs > div span:last-child { font-family: var(--display); font-weight: 700; color: var(--bone); }
        .pdp__desc { font-size: 16px; line-height: 1.65; color: var(--bone-2); white-space: pre-wrap; }
        .pdp__related { margin-top: 80px; padding-bottom: 80px; }
      `}</style>

      <div className="mm-root mm-container pdp">
        <nav className="pdp__crumb">
          <Link href="/">{lang === "el" ? "Αρχική" : "Home"}</Link>
          <span className="sep">/</span>
          <Link href={`/category/${product.category_slug}`}>
            {product.category_name}
          </Link>
          <span className="sep">/</span>
          <span className="here">{product.brand}</span>
        </nav>

        <div className="pdp__layout">
          {/* GALLERY */}
          <div className="pdp__gallery">
            <div className="pdp__main">
              {product.images[activeImg] && (
                <Image
                  src={product.images[activeImg].url}
                  alt={product.images[activeImg].alt}
                  fill
                  priority
                  sizes="(max-width: 1000px) 100vw, 50vw"
                />
              )}
              <div className="b">
                {discount > 0 && <span className="sale">−{discount}%</span>}
                {product.stock === 0 && (
                  <span className="oos">
                    {lang === "el" ? "ΕΞΑΝΤΛΗΘΗΚΕ" : "SOLD OUT"}
                  </span>
                )}
              </div>
            </div>
            {product.images.length > 1 && (
              <div className="pdp__thumbs">
                {product.images.slice(0, 4).map((img, i) => (
                  <button
                    key={img.url}
                    className={
                      "pdp__thumb " + (i === activeImg ? "is-active" : "")
                    }
                    onClick={() => setActiveImg(i)}
                    aria-label={`Image ${i + 1}`}
                  >
                    <Image src={img.url} alt={img.alt} fill sizes="120px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BUY BOX */}
          <aside className="pdp__buy">
            <span className="pdp__brand">
              {product.brand} · {product.category_name}
            </span>
            <h1 className="pdp__name">{product.name}</h1>
            <div className="pdp__rating">
              {product.average_rating && (
                <>
                  <span className="stars">
                    {"★".repeat(Math.round(product.average_rating))}
                  </span>
                  <span>
                    {product.average_rating.toFixed(1)} · {product.review_count}{" "}
                    {lang === "el" ? "κριτικές" : "reviews"}
                  </span>
                  <span style={{ opacity: 0.5 }}>·</span>
                </>
              )}
              {product.sku && <span>SKU {product.sku}</span>}
            </div>

            <div className="pdp__price">
              <span className="now">
                €{product.price.toFixed(2).replace(".", ",")}
              </span>
              {product.compare_at_price &&
                product.compare_at_price > product.price && (
                  <>
                    <span className="old">
                      €{product.compare_at_price.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="save">
                      {lang === "el" ? "ΓΛΥΤΩΝΕΙΣ" : "SAVE"} €
                      {(product.compare_at_price - product.price)
                        .toFixed(2)
                        .replace(".", ",")}
                    </span>
                  </>
                )}
            </div>

            <div className="pdp__cta">
              <button
                className="add"
                disabled={product.stock === 0}
                onClick={() => addToCart(asCartProduct)}
              >
                {product.stock === 0
                  ? lang === "el"
                    ? "Εξαντλήθηκε"
                    : "Sold out"
                  : `+ ${lang === "el" ? "Προσθήκη στο καλάθι" : "Add to cart"}`}
              </button>
              <button
                className={"wish " + (isWished ? "is-on" : "")}
                onClick={() => toggleWish(product.slug)}
                aria-label="Wishlist"
              >
                ♥
              </button>
            </div>

            <div className="pdp__signals">
              <span className="s">
                <span className={product.stock > 0 ? "dotg" : "dotr"} />
                <strong>
                  {product.stock > 0
                    ? lang === "el"
                      ? `Διαθέσιμο · ${product.stock}τμχ`
                      : `In stock · ${product.stock}`
                    : lang === "el"
                      ? "Εξαντλήθηκε"
                      : "Out of stock"}
                </strong>
              </span>
              {product.certification && (
                <span className="s">
                  <strong>{product.certification}</strong>
                </span>
              )}
              {product.view_count > 0 && (
                <span className="s">
                  <strong>{product.view_count}</strong>{" "}
                  {lang === "el" ? "προβολές" : "views"}
                </span>
              )}
              <span className="s">
                <strong>{lang === "el" ? "Αύριο" : "Tomorrow"}</strong>{" "}
                {lang === "el" ? "παράδοση" : "delivery"}
              </span>
            </div>

            <div className="pdp__trust">
              <div className="row">
                <span>◆</span>
                <strong>
                  {lang === "el"
                    ? "Επίσημη αντιπροσωπεία"
                    : "Official distributor"}
                </strong>{" "}
                —{" "}
                {lang === "el"
                  ? "εγγύηση κατασκευαστή"
                  : "manufacturer warranty"}
              </div>
              <div className="row">
                <span>◆</span>
                <strong>
                  {lang === "el" ? "Αυθημερόν αποστολή" : "Same-day dispatch"}
                </strong>{" "}
                — {lang === "el" ? "πριν τις 14:00" : "before 2pm"}
              </div>
              <div className="row">
                <span>◆</span>
                <strong>
                  {lang === "el" ? "Δωρεάν επιστροφές" : "Free returns"}
                </strong>{" "}
                — 14 {lang === "el" ? "ημέρες" : "days"}
              </div>
              <div className="row">
                <span>◆</span>
                {lang === "el" ? "Πληρωμή: " : "Payment: "}
                <strong>Viva · IRIS · COD · Δόσεις</strong>
              </div>
            </div>
          </aside>
        </div>

        {/* TABS */}
        <div className="pdp__tabs">
          <div className="pdp__tabs-nav">
            <button
              className={openTab === "specs" ? "is-on" : ""}
              onClick={() => setOpenTab("specs")}
            >
              {lang === "el" ? "Προδιαγραφές" : "Specifications"}
              {specEntries.length > 0 && ` (${specEntries.length})`}
            </button>
            <button
              className={openTab === "desc" ? "is-on" : ""}
              onClick={() => setOpenTab("desc")}
            >
              {lang === "el" ? "Περιγραφή" : "Description"}
            </button>
            <button
              className={openTab === "shipping" ? "is-on" : ""}
              onClick={() => setOpenTab("shipping")}
            >
              {lang === "el" ? "Αποστολή & επιστροφές" : "Shipping & returns"}
            </button>
          </div>
          <div className="pdp__tab">
            {openTab === "specs" &&
              (specEntries.length > 0 ? (
                <div className="pdp__specs">
                  {specEntries.map(([k, v]) => (
                    <div key={k}>
                      <span>{k}</span>
                      <span>{String(v)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--muted)" }}>
                  {lang === "el"
                    ? "Δεν υπάρχουν προδιαγραφές."
                    : "No specifications yet."}
                </p>
              ))}
            {openTab === "desc" && (
              <p className="pdp__desc">{product.description ?? product.name}</p>
            )}
            {openTab === "shipping" && (
              <div className="pdp__desc">
                <p>
                  <strong style={{ color: "var(--bone)" }}>
                    {lang === "el" ? "Αποστολή" : "Shipping"}
                  </strong>
                  <br />
                  {lang === "el"
                    ? "Δωρεάν για παραγγελίες άνω των 50€. Αυθημερόν αν παραγγείλεις πριν τις 14:00 εργάσιμη ημέρα."
                    : "Free over €50. Same-day dispatch on weekday orders placed before 2pm."}
                </p>
                <p style={{ marginTop: 16 }}>
                  <strong style={{ color: "var(--bone)" }}>
                    {lang === "el" ? "Επιστροφές" : "Returns"}
                  </strong>
                  <br />
                  {lang === "el"
                    ? "14 ημέρες δωρεάν επιστροφή. Το προϊόν πρέπει να είναι αχρησιμοποίητο."
                    : "14-day free returns. Item must be unused."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RELATED */}
        {related.length > 0 && (
          <section className="mm-root pdp__related">
            <SectionHeader
              eyebrow={lang === "el" ? "Επίσης" : "You might also like"}
              h={
                lang === "el"
                  ? "Από την ίδια κατηγορία"
                  : "From the same category"
              }
            />
            <div className="mm-products">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/product/${r.slug}`}
                  style={{ display: "block" }}
                >
                  <ProductCard p={toCardProduct(r)} t={t} lang={lang} />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
