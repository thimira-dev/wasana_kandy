/**
 * Cake Preparation and Ready-Date Business Rules
 *
 * Enforces the minimum 4-calendar-day lead time according to Sri Lankan local time (Asia/Colombo).
 */

export const SRI_LANKA_TIMEZONE = "Asia/Colombo";
export const MINIMUM_PREPARATION_DAYS = 4;

/**
 * Returns the calendar year, month, and day in Sri Lanka timezone (Asia/Colombo).
 */
export function getSriLankaDateParts(date: Date = new Date()): { year: number; month: number; day: number } {
  // Use en-CA to produce ISO format "YYYY-MM-DD"
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: SRI_LANKA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.format(date).split("-");
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10),
  };
}

/**
 * Returns current Sri Lanka date as "YYYY-MM-DD" string.
 */
export function getSriLankaDateString(date: Date = new Date()): string {
  const { year, month, day } = getSriLankaDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Calculates the earliest allowed ready date string ("YYYY-MM-DD")
 * by adding MINIMUM_PREPARATION_DAYS (4 days) to the Sri Lankan order placement date.
 *
 * Example:
 * If order is placed on Sept 22:
 * Earliest date = Sept 26
 */
export function getEarliestReadyDate(orderPlacementDate: Date = new Date()): string {
  const { year, month, day } = getSriLankaDateParts(orderPlacementDate);
  // Construct date at noon UTC to prevent DST or midnight shift issues
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  utcDate.setUTCDate(utcDate.getUTCDate() + MINIMUM_PREPARATION_DAYS);
  return utcDate.toISOString().split("T")[0];
}

/**
 * Validates whether a candidate ready date (YYYY-MM-DD) satisfies the 4-day rule.
 */
export function validateReadyDate(
  candidateDateString: string,
  orderPlacementDate: Date = new Date()
): { isValid: boolean; error?: string; earliestDate: string } {
  const earliestDate = getEarliestReadyDate(orderPlacementDate);

  if (!candidateDateString || !/^\d{4}-\d{2}-\d{2}$/.test(candidateDateString)) {
    return {
      isValid: false,
      error: "Please select a valid date in YYYY-MM-DD format.",
      earliestDate,
    };
  }

  // String comparison on ISO format (YYYY-MM-DD) is lexicographically correct for chronological order
  if (candidateDateString < earliestDate) {
    return {
      isValid: false,
      error: `Cake ready date must be at least ${MINIMUM_PREPARATION_DAYS} days from today. Earliest available date is ${earliestDate}.`,
      earliestDate,
    };
  }

  return {
    isValid: true,
    earliestDate,
  };
}
