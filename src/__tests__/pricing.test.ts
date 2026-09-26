import { describe, it, expect } from "vitest";
import {
  parsePriceToCents,
  centsToDecimalString,
  formatLKR,
  calculateCustomizedPrice,
} from "../lib/domain/pricing";

describe("Pricing Domain Logic", () => {
  it("converts decimal and string amounts to integer cents accurately", () => {
    expect(parsePriceToCents("4500.00")).toBe(450000);
    expect(parsePriceToCents(4500)).toBe(450000);
    expect(parsePriceToCents("0.50")).toBe(50);
    expect(parsePriceToCents("1200.75")).toBe(120075);
    expect(parsePriceToCents("")).toBe(0);
    expect(parsePriceToCents(0)).toBe(0);
  });

  it("converts cents back to decimal string without floating point inaccuracies", () => {
    expect(centsToDecimalString(450000)).toBe("4500.00");
    expect(centsToDecimalString(120075)).toBe("1200.75");
    expect(centsToDecimalString(50)).toBe("0.50");
    expect(centsToDecimalString(0)).toBe("0.00");
  });

  it("formats LKR currency strings cleanly with en-LK thousand separators", () => {
    expect(formatLKR(450000)).toBe("LKR 4,500.00");
    expect(formatLKR("4500.00")).toBe("LKR 4,500.00");
    expect(formatLKR("1250000")).toBe("LKR 1,250,000.00");
    expect(formatLKR(0)).toBe("LKR 0.00");
  });

  it("calculates customized price: base price + selected options adjustments", () => {
    const basePrice = "4500.00";
    const selectedOptions = [
      { label: "1.5 kg", priceAdjustment: "1200.00" },
      { label: "Blush Pink", priceAdjustment: "0.00" },
    ];

    const result = calculateCustomizedPrice(basePrice, selectedOptions);

    expect(result.basePriceCents).toBe(450000);
    expect(result.adjustmentsCents).toBe(120000);
    expect(result.totalCents).toBe(570000);
    expect(result.totalDecimal).toBe("5700.00");
    expect(result.totalFormatted).toBe("LKR 5,700.00");
  });

  it("handles zero adjustments correctly", () => {
    const basePrice = 3800;
    const selectedOptions = [
      { label: "1 kg", priceAdjustment: 0 },
      { label: "Classic Gold", priceAdjustment: 0 },
    ];

    const result = calculateCustomizedPrice(basePrice, selectedOptions);

    expect(result.totalCents).toBe(380000);
    expect(result.adjustmentsCents).toBe(0);
    expect(result.totalFormatted).toBe("LKR 3,800.00");
  });

  it("does not allow negative totals", () => {
    const result = calculateCustomizedPrice("100.00", [
      { priceAdjustment: "-200.00" },
    ]);
    expect(result.totalCents).toBe(0);
  });
});
