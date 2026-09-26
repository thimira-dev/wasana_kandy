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

export function formatLKR(amountInCentsOrDecimal: number | string): string {
  let cents: number;
  if (typeof amountInCentsOrDecimal === "number" && Number.isInteger(amountInCentsOrDecimal)) {
    // Already in cents
    cents = amountInCentsOrDecimal;
  } else {
    cents = parsePriceToCents(amountInCentsOrDecimal);
  }

  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const whole = Math.floor(absCents / 100);
  const frac = absCents % 100;

  const formattedWhole = new Intl.NumberFormat("en-LK").format(whole);
  const formattedFrac = frac.toString().padStart(2, "0");

  return `${isNegative ? "-" : ""}LKR ${formattedWhole}.${formattedFrac}`;
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
    basePriceFormatted: formatLKR(basePriceCents),
    adjustmentsFormatted: formatLKR(adjustmentsCents),
    totalFormatted: formatLKR(totalCents),
    totalDecimal: centsToDecimalString(totalCents),
  };
}
