import Link from "next/link";

export function UtilityBar() {
  return (
    <div className="v3-utility-bar">
      <div className="v3-utility-status" aria-label="Store status">
        <span>Official brands</span>
        <i aria-hidden="true" />
        <span>Αποστολή 1-3 ημέρες</span>
        <i aria-hidden="true" />
        <span>Αλλαγές μεγέθους</span>
      </div>
      <nav className="v3-utility-links" aria-label="Βοηθητική πλοήγηση">
        <Link href="/account">Λογαριασμός</Link>
        <Link href="/wishlist">Wishlist</Link>
        <a href="tel:+302109535195">210 95 35 195</a>
      </nav>
    </div>
  );
}
