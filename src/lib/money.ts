const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats cents as "1.250,50" (no currency symbol). */
export function formatCentsPlain(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** Formats cents as "R$ 1.250,50". */
export function formatCurrency(cents: number): string {
  return `R$ ${formatCentsPlain(Math.abs(cents))}`;
}

/** Formats a result with explicit sign, e.g. "+R$ 250,00" / "-R$ 150,00" / "R$ 0,00". */
export function formatSignedCurrency(cents: number): string {
  if (cents > 0) return `+${formatCurrency(cents)}`;
  if (cents < 0) return `-${formatCurrency(cents)}`;
  return formatCurrency(0);
}

/**
 * Parses user-typed money text (pt-BR conventions) into integer cents.
 * Accepts "1000", "1.000", "1000,5", "1.000,50", "1000.50".
 */
export function parseMoneyToCents(raw: string): number {
  const cleaned = raw.trim().replace(/[^\d.,-]/g, "");
  if (!cleaned) return 0;

  const negative = cleaned.startsWith("-");
  const digits = cleaned.replace(/-/g, "");

  const hasComma = digits.includes(",");
  const hasDot = digits.includes(".");

  let normalized: string;
  if (hasComma && hasDot) {
    normalized = digits.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = digits.replace(",", ".");
  } else if (hasDot) {
    const parts = digits.split(".");
    const last = parts[parts.length - 1];
    const looksLikeDecimal = parts.length === 2 && last.length <= 2;
    normalized = looksLikeDecimal ? digits : digits.replace(/\./g, "");
  } else {
    normalized = digits;
  }

  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value)) return 0;

  const cents = Math.round(value * 100);
  return negative ? -cents : cents;
}
