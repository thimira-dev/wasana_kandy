/** Exact conversion of Decimal(12,2), without floating-point multiplication. */
export function orderTotalToCents(total: { toString(): string } | string): number {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(total.toString());
  if (!match) throw new Error("Invalid order amount");
  const cents = BigInt(match[1]) * BigInt(100) + BigInt((match[2] || "").padEnd(2, "0"));
  if (cents <= BigInt(0) || cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Invalid order amount");
  }
  return Number(cents);
}
