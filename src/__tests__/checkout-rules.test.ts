import { describe, it, expect } from "vitest";
import {
  getSriLankaDateParts,
  getSriLankaDateString,
  getEarliestReadyDate,
  validateReadyDate,
} from "../lib/domain/date-rules";
import {
  normalizeSriLankanPhone,
  isValidSriLankanPhone,
} from "../lib/domain/phone-rules";
import { checkoutDetailsSchema } from "../lib/domain/validation";

describe("Cake Ready Date Rules & Timezone Handling", () => {
  it("accepts a ready date exactly 4 days ahead", () => {
    // 2026-09-22 10:00:00 in Sri Lanka
    const orderDate = new Date("2026-09-22T10:00:00+05:30");
    const earliest = getEarliestReadyDate(orderDate);
    expect(earliest).toBe("2026-09-26");

    const check = validateReadyDate("2026-09-26", orderDate);
    expect(check.isValid).toBe(true);
  });

  it("rejects a ready date 3 days ahead", () => {
    const orderDate = new Date("2026-09-22T10:00:00+05:30");
    const check = validateReadyDate("2026-09-25", orderDate);
    expect(check.isValid).toBe(false);
    expect(check.error).toContain("must be at least 4 days from today");
  });

  it("correctly handles Sri Lankan local date around the midnight date boundary", () => {
    // Case A: 23:55 on 2026-09-22 in Sri Lanka (18:25 UTC)
    const lateNightDate = new Date("2026-09-22T23:55:00+05:30");
    expect(getSriLankaDateString(lateNightDate)).toBe("2026-09-22");
    expect(getEarliestReadyDate(lateNightDate)).toBe("2026-09-26");

    // Case B: 00:05 on 2026-09-23 in Sri Lanka (18:35 UTC on Sept 22)
    const justPastMidnight = new Date("2026-09-23T00:05:00+05:30");
    expect(getSriLankaDateString(justPastMidnight)).toBe("2026-09-23");
    expect(getEarliestReadyDate(justPastMidnight)).toBe("2026-09-27");

    // On Sept 23 00:05, Sept 26 is now only 3 days ahead, so it must be rejected!
    const checkSept26 = validateReadyDate("2026-09-26", justPastMidnight);
    expect(checkSept26.isValid).toBe(false);

    // Sept 27 is 4 days ahead, so it is accepted!
    const checkSept27 = validateReadyDate("2026-09-27", justPastMidnight);
    expect(checkSept27.isValid).toBe(true);
  });

  it("accepts dates further into the future (> 4 days)", () => {
    const orderDate = new Date("2026-09-22T10:00:00+05:30");
    const check = validateReadyDate("2026-10-15", orderDate);
    expect(check.isValid).toBe(true);
  });
});

describe("Sri Lankan Phone Validation & Normalization", () => {
  it("accepts and normalizes standard 10-digit mobile numbers (e.g. 0771234567)", () => {
    expect(isValidSriLankanPhone("0771234567")).toBe(true);
    expect(normalizeSriLankanPhone("077 123 4567")).toBe("0771234567");
    expect(normalizeSriLankanPhone("077-1234567")).toBe("0771234567");
  });

  it("accepts and normalizes international format numbers (+94771234567)", () => {
    expect(isValidSriLankanPhone("+94771234567")).toBe(true);
    expect(normalizeSriLankanPhone("+94 77 123 4567")).toBe("0771234567");
    expect(normalizeSriLankanPhone("+94771234567")).toBe("0771234567");
  });

  it("accepts landline numbers in Kandy (0812234567)", () => {
    expect(isValidSriLankanPhone("0812234567")).toBe(true);
    expect(normalizeSriLankanPhone("+94 81 223 4567")).toBe("0812234567");
  });

  it("rejects invalid phone numbers", () => {
    expect(isValidSriLankanPhone("12345")).toBe(false);
    expect(isValidSriLankanPhone("077123456789")).toBe(false); // too long
    expect(isValidSriLankanPhone("0000000000")).toBe(false);
    expect(isValidSriLankanPhone("abcdefghij")).toBe(false);
    expect(isValidSriLankanPhone("")).toBe(false);
  });
});

describe("Customer Details Schema Validation", () => {
  const validData = {
    customerName: "Nethmi Jayawardena",
    customerEmail: "nethmi@example.com",
    phonePrimary: "0771234567",
    phoneSecondary: "0812234567",
    branchId: "branch-kandy-1",
    readyDate: getEarliestReadyDate(),
  };

  it("validates valid customer details successfully", () => {
    const parsed = checkoutDetailsSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it("rejects when required customer fields are missing", () => {
    const invalid = { ...validData, customerName: "" };
    const parsed = checkoutDetailsSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid email addresses", () => {
    const invalid = { ...validData, customerEmail: "invalid-email" };
    const parsed = checkoutDetailsSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid primary phone numbers", () => {
    const invalid = { ...validData, phonePrimary: "not-a-phone" };
    const parsed = checkoutDetailsSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("allows omitting the optional secondary phone", () => {
    const withoutSecondary = { ...validData, phoneSecondary: undefined };
    const parsed = checkoutDetailsSchema.safeParse(withoutSecondary);
    expect(parsed.success).toBe(true);
  });

  it("rejects when ready date violates the 4-day rule", () => {
    const invalidDate = { ...validData, readyDate: "2020-01-01" };
    const parsed = checkoutDetailsSchema.safeParse(invalidDate);
    expect(parsed.success).toBe(false);
  });
});
