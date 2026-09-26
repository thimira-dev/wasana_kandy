/**
 * Wasana Bakers Physical Catalogue Taxonomy and Code System
 */

export interface CollectionDefinition {
  code: string;
  name: string;
  displayName: string;
  isSeasonal?: boolean;
}

export const KNOWN_COLLECTIONS: CollectionDefinition[] = [
  { code: "G", name: "G Collection", displayName: "G — G Collection" },
  { code: "M", name: "Mini Cake", displayName: "M — Mini Cake" },
  { code: "N", name: "N Collection", displayName: "N — N Collection" },
  { code: "S", name: "Wasana Special", displayName: "S — Wasana Special" },
  { code: "ND", name: "New Design Mini Cake", displayName: "ND — New Design Mini Cake" },
  { code: "P", name: "Parchment", displayName: "P — Parchment" },
  { code: "E", name: "Edible Printed Photo Cake", displayName: "E — Edible Printed Photo Cake" },
  { code: "GU", name: "Special Icing Cake", displayName: "GU — Special Icing Cake" },
  { code: "NC", name: "Cherry Cake", displayName: "NC — Cherry Cake" },
  { code: "NY", name: "New Year Special", displayName: "NY — New Year Special", isSeasonal: true },
  { code: "X", name: "Christmas Special", displayName: "X — Christmas Special", isSeasonal: true },
  { code: "C", name: "Cup Cakes", displayName: "C — Cup Cakes" },
  { code: "NYC", name: "New Year Cup Cakes", displayName: "NYC — New Year Cup Cakes", isSeasonal: true },
  { code: "PC", name: "PC Collection", displayName: "PC — PC Collection" },
];

export const MAIN_CATEGORIES = [
  "Birthday Cakes",
  "Wedding Cakes",
  "Celebration Cakes",
  "Mini Cakes",
  "Printed Cakes",
  "Special Cakes",
  "Seasonal Cakes",
  "Cup Cakes",
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];

/**
 * Generates the canonical catalogue code from collection code and design number.
 * Example:
 *   generateCatalogueCode("G", 43) -> "G-43"
 *   generateCatalogueCode("G", 1)  -> "G-01"
 *   generateCatalogueCode("nd", 14) -> "ND-14"
 */
export function generateCatalogueCode(
  collectionCode: string,
  designNumber: number | string
): string {
  if (!collectionCode || designNumber === null || designNumber === undefined) {
    return "";
  }

  const cleanCollection = collectionCode.trim().toUpperCase();
  const num = typeof designNumber === "number" ? designNumber : parseInt(designNumber.toString().trim(), 10);

  if (isNaN(num) || num <= 0) {
    return "";
  }

  // Consistent zero-padding for single-digit numbers to match physical catalogue (e.g. G-01)
  const formattedNum = num < 10 ? `0${num}` : num.toString();
  return `${cleanCollection}-${formattedNum}`;
}

/**
 * Parses user search query to detect if they typed a catalogue code variant
 * (e.g. "G43", "G 43", "g-43", "ND12", "nd-012", "s 1") and returns the canonical form.
 */
export function normalizeCodeSearch(query: string): string | null {
  if (!query) return null;
  const trimmed = query.trim();

  // Match letters followed by optional spaces/hyphens and digits
  const match = trimmed.match(/^([a-zA-Z]{1,3})[\s\-_]*0*(\d{1,4})$/);
  if (!match) return null;

  const letterPart = match[1].toUpperCase();
  const numberPart = parseInt(match[2], 10);

  if (isNaN(numberPart) || numberPart <= 0) return null;

  // Check if letter prefix matches a known collection code
  const isKnown = KNOWN_COLLECTIONS.some((c) => c.code === letterPart);
  if (!isKnown) {
    // If not in known list, still format if reasonable 1-3 letters
    return generateCatalogueCode(letterPart, numberPart);
  }

  return generateCatalogueCode(letterPart, numberPart);
}

/**
 * Returns a user-facing display title for a cake, falling back to "Wasana Cake [Code]"
 * if no custom marketing name was provided.
 */
export function getProductDisplayName(product: {
  name?: string | null;
  catalogueCode?: string | null;
}): string {
  if (product.name && product.name.trim().length > 0) {
    return product.name.trim();
  }
  if (product.catalogueCode) {
    return `Wasana Cake ${product.catalogueCode}`;
  }
  return "Wasana Celebration Cake";
}
