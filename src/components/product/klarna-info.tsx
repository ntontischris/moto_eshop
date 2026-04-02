interface KlarnaInfoProps {
  price: number;
  installments?: number;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function KlarnaInfo({ price, installments = 3 }: KlarnaInfoProps) {
  if (price < 30) return null;
  const installmentAmount = price / installments;

  return (
    <p className="text-sm text-muted-foreground">
      ή{" "}
      <strong className="text-foreground">
        {installments} × {formatEuro(installmentAmount)}
      </strong>{" "}
      με <span className="font-semibold text-[#FFB3C7]">Klarna</span>
    </p>
  );
}
