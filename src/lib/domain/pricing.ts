/**
 * Money and Pricing Domain Logic
 * Avoids floating-point precision issues by calculating in integer cents.
 */

export function parsePriceToCents(val: string | number | { toString(): string }): number {
  if (val === null || val === undefined) return 0;
  const str = val.toString().trim();
  if (!str) return 0;

  // Split on decimal point if present
  const parts = str.split(".");
  const whole = parseInt(parts[0] || "0", 10);
  if (isNaN(whole)) return 0;

  let frac = 0;
  if (parts.length > 1) {
    const fracStr = (parts[1] + "00").substring(0, 2);
    frac = parseInt(fracStr, 10);
    if (isNaN(frac)) frac = 0;
  }

  const sign = str.startsWith("-") ? -1 : 1;
  return sign * (Math.abs(whole) * 100 + frac);
}

export function centsToDecimalString(cents: number): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const whole = Math.floor(absCents / 100);
  const frac = absCents % 100;
  return `${isNegative ? "-" : ""}${whole}.${frac.toString().padStart(2, "0")}`;
}

export function formatLKRCents(cents: number): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const whole = Math.floor(absCents / 100);
  const frac = absCents % 100;

  const formattedWhole = new Intl.NumberFormat("en-LK").format(whole);
  const formattedFrac = frac.toString().padStart(2, "0");

  return `${isNegative ? "-" : ""}LKR ${formattedWhole}.${formattedFrac}`;
}

export function formatLKR(amountInCentsOrDecimal: number | string): string {
  if (amountInCentsOrDecimal === null || amountInCentsOrDecimal === undefined) {
    return "LKR 0.00";
  }

  // If passed an integer number >= 100000 (likely in cents from internal legacy calculation), treat as cents
  if (
    typeof amountInCentsOrDecimal === "number" &&
    Number.isInteger(amountInCentsOrDecimal) &&
    Math.abs(amountInCentsOrDecimal) >= 100000
  ) {
    return formatLKRCents(amountInCentsOrDecimal);
  }

  // Standard case: amount is in LKR decimal (e.g. 3500, "3500.00", 3500.50)
  const cents = parsePriceToCents(amountInCentsOrDecimal);
  return formatLKRCents(cents);
}

export interface OptionPriceAdjustment {
  id?: string;
  label?: string;
  priceAdjustment: string | number;
}

export interface PriceCalculationResult {
  basePriceCents: number;
  adjustmentsCents: number;
  totalCents: number;
  basePriceFormatted: string;
  adjustmentsFormatted: string;
  totalFormatted: string;
  totalDecimal: string;
}

/**
 * Calculates total price = base price + sum of active selected option adjustments.
 * Pure business logic function reusable across frontend and server-side checkout.
 */
export function calculateCustomizedPrice(
  basePrice: string | number,
  selectedOptions: OptionPriceAdjustment[] = []
): PriceCalculationResult {
  const basePriceCents = parsePriceToCents(basePrice);

  const adjustmentsCents = selectedOptions.reduce((acc, opt) => {
    return acc + parsePriceToCents(opt.priceAdjustment || 0);
  }, 0);

  const totalCents = Math.max(0, basePriceCents + adjustmentsCents);

  return {
    basePriceCents,
    adjustmentsCents,
    totalCents,
    basePriceFormatted: formatLKRCents(basePriceCents),
    adjustmentsFormatted: formatLKRCents(adjustmentsCents),
    totalFormatted: formatLKRCents(totalCents),
    totalDecimal: centsToDecimalString(totalCents),
  };
}
