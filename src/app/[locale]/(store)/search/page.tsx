import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { searchProducts } from "@/lib/queries/products";
import { ProductCard } from "../_components/commerce/product-card";

export const metadata: Metadata = {
  title: "Αναζήτηση | MotoMarket",
  robots: { index: false },
};

const PER_PAGE = 24;

export default function SearchPage(props: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent {...props} />
    </Suspense>
  );
}

async function SearchContent({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const res = q
    ? await searchProducts(q, page, PER_PAGE, locale)
    : { data: [], total: 0, page: 1, perPage: PER_PAGE, totalPages: 0 };

  const base = `/search?q=${encodeURIComponent(q)}`;

  return (
    <div className="v3-srch">
      <nav className="v3-srch-bc" aria-label="Breadcrumb">
        <Link href="/">Αρχική</Link>
        <span aria-hidden="true">/</span>
        <span>Αναζήτηση</span>
      </nav>

      <h1 className="v3-display">
        Αναζήτηση<span className="v3-srch-dot">.</span>
      </h1>

      {!q ? (
        <p className="v3-srch-hint">
          Πληκτρολόγησε στην μπάρα αναζήτησης πάνω για να βρεις προϊόντα.
        </p>
      ) : res.data.length === 0 ? (
        <div className="v3-srch-empty">
          <p>
            Κανένα αποτέλεσμα για «<strong>{q}</strong>».
          </p>
          <Link className="v3-btn-primary" href="/category/eksoplismos-anabath">
            Δες όλο τον εξοπλισμό <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <>
          <p className="v3-srch-count">
            {res.total} αποτελέσματα για «<strong>{q}</strong>»
          </p>
          <div className="v3-srch-grid">
            {res.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {res.totalPages > 1 && (
            <nav className="v3-srch-pager" aria-label="Σελιδοποίηση">
              {page > 1 && (
                <Link href={`${base}&page=${page - 1}`}>← Προηγούμενη</Link>
              )}
              <span>
                Σελίδα {page} / {res.totalPages}
              </span>
              {page < res.totalPages && (
                <Link href={`${base}&page=${page + 1}`}>Επόμενη →</Link>
              )}
            </nav>
          )}
        </>
      )}

      <style precedence="default">{`
        .v3-srch { max-width: 1320px; margin: 0 auto;
          padding: 28px var(--v3-gutter) 90px; }
        .v3-srch-bc { display: flex; gap: 8px; font-size: .82rem;
          color: var(--v3-bone-dim); margin-bottom: 18px; }
        .v3-srch-bc a { color: var(--v3-bone-dim); text-decoration: none; }
        .v3-srch-bc a:hover { color: var(--v3-bone); }
        .v3-srch h1 { margin: 0 0 10px; font-size: clamp(2rem,5vw,3.4rem);
          font-weight: 900; text-transform: uppercase; transform: skewX(-6deg);
          color: var(--v3-bone); }
        .v3-srch-dot { color: var(--v3-red); }
        .v3-srch-hint, .v3-srch-count { color: var(--v3-bone-dim);
          margin: 6px 0 26px; }
        .v3-srch-count strong, .v3-srch-empty strong { color: var(--v3-bone); }
        .v3-srch-empty { display: flex; flex-direction: column;
          align-items: flex-start; gap: 18px; color: var(--v3-bone-dim);
          padding: 30px 0; }
        .v3-srch-empty .v3-btn-primary { text-decoration: none; }
        .v3-srch-grid { display: grid;
          grid-template-columns: repeat(4, 1fr); gap: 18px; }
        .v3-srch-pager { display: flex; align-items: center; gap: 18px;
          justify-content: center; margin-top: 40px;
          color: var(--v3-bone-dim); }
        .v3-srch-pager a { color: var(--v3-bone); text-decoration: none;
          font-weight: 700; }
        @media (max-width: 1100px) {
          .v3-srch-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 760px) {
          .v3-srch-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .v3-srch-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
      `}</style>
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="v3-srch" aria-hidden="true">
      <div className="h-8 w-52 rounded bg-white/10" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-80 rounded-lg bg-white/10" key={index} />
        ))}
      </div>
    </div>
  );
}
