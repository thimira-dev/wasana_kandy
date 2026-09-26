/**
 * Sri Lankan Phone Number Normalization and Validation
 */

export function normalizeSriLankanPhone(raw: string): string {
  if (!raw) return "";
  // Strip whitespace, hyphens, parentheses, dots
  let cleaned = raw.trim().replace(/[\s\-\(\)\.]/g, "");

  // Convert 0094... to +94...
  if (cleaned.startsWith("0094")) {
    cleaned = "+94" + cleaned.slice(4);
  }

  // Convert +947XXXXXXXX to standard local 07XXXXXXXX for consistency
  if (cleaned.startsWith("+94") && cleaned.length === 12) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("94") && cleaned.length === 11) {
    cleaned = "0" + cleaned.slice(2);
  }

  return cleaned;
}

export function isValidSriLankanPhone(raw: string): boolean {
  if (!raw) return false;
  const normalized = normalizeSriLankanPhone(raw);
  // Valid local format: 10 digits starting with 0, followed by non-zero digit and 8 digits
  // Mobile (070, 071, 072, 074, 075, 076, 077, 078) or Landlines (011, 081, etc.)
  return /^0[1-9]\d{8}$/.test(normalized);
}
