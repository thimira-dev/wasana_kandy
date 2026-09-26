import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma";
import { ProductService } from "../lib/services/product-service";
import {
  generateCatalogueCode,
  normalizeCodeSearch,
  getProductDisplayName,
} from "../lib/domain/catalogue";
import { Prisma } from "@prisma/client";

describe("Catalogue Domain Unit Tests", () => {
  describe("generateCatalogueCode", () => {
    it("formats collection code and design number with standard two-digit padding", () => {
      expect(generateCatalogueCode("G", 43)).toBe("G-43");
      expect(generateCatalogueCode("G", 1)).toBe("G-01");
      expect(generateCatalogueCode("G", "9")).toBe("G-09");
      expect(generateCatalogueCode("g", 5)).toBe("G-05");
      expect(generateCatalogueCode("ND", 14)).toBe("ND-14");
      expect(generateCatalogueCode("nd", 2)).toBe("ND-02");
      expect(generateCatalogueCode("NY", 1)).toBe("NY-01");
      expect(generateCatalogueCode("S", 100)).toBe("S-100");
    });

    it("returns empty string for invalid inputs", () => {
      expect(generateCatalogueCode("", 5)).toBe("");
      expect(generateCatalogueCode("G", 0)).toBe("");
      expect(generateCatalogueCode("G", -1)).toBe("");
      expect(generateCatalogueCode("G", NaN)).toBe("");
    });
  });

  describe("normalizeCodeSearch", () => {
    it("detects and normalizes various catalogue code formats to canonical representation", () => {
      expect(normalizeCodeSearch("G43")).toBe("G-43");
      expect(normalizeCodeSearch("G 43")).toBe("G-43");
      expect(normalizeCodeSearch("g-43")).toBe("G-43");
      expect(normalizeCodeSearch("g 43")).toBe("G-43");
      expect(normalizeCodeSearch("g43")).toBe("G-43");

      expect(normalizeCodeSearch("ND14")).toBe("ND-14");
      expect(normalizeCodeSearch("nd 14")).toBe("ND-14");
      expect(normalizeCodeSearch("nd-14")).toBe("ND-14");
      expect(normalizeCodeSearch("nd014")).toBe("ND-14");

      expect(normalizeCodeSearch("S1")).toBe("S-01");
      expect(normalizeCodeSearch("s 1")).toBe("S-01");
      expect(normalizeCodeSearch("s-01")).toBe("S-01");
      expect(normalizeCodeSearch("m01")).toBe("M-01");
    });

    it("returns null for non-code text search terms", () => {
      expect(normalizeCodeSearch("chocolate")).toBeNull();
      expect(normalizeCodeSearch("floral bloom")).toBeNull();
      expect(normalizeCodeSearch("birthday cake")).toBeNull();
      expect(normalizeCodeSearch("")).toBeNull();
    });
  });

  describe("getProductDisplayName", () => {
    it("returns the custom cake name when available", () => {
      expect(
        getProductDisplayName({
          name: "Butter Cream Floral Cake",
          catalogueCode: "G-43",
        })
      ).toBe("Butter Cream Floral Cake");
    });

    it("falls back to 'Wasana Cake [Code]' when name is blank or missing", () => {
      expect(getProductDisplayName({ name: "", catalogueCode: "G-43" })).toBe(
        "Wasana Cake G-43"
      );
      expect(getProductDisplayName({ name: null, catalogueCode: "ND-14" })).toBe(
        "Wasana Cake ND-14"
      );
    });

    it("falls back to default celebration cake title if neither name nor code is set", () => {
      expect(getProductDisplayName({ name: "", catalogueCode: null })).toBe(
        "Wasana Celebration Cake"
      );
    });
  });
});

describe("ProductService Catalogue Search, Filtering & Code Validation", () => {
  const createdProductIds: string[] = [];

  beforeAll(async () => {
    // Clean up any test cakes with these unique codes
    await prisma.product.deleteMany({
      where: {
        catalogueCode: {
          in: ["TEST-G-99", "TEST-M-88", "TEST-ND-77"],
        },
      },
    });

    // Create 3 test products for integration tests
    const p1 = await prisma.product.create({
      data: {
        name: "Test Golden Floral Cake",
        slug: `test-golden-floral-${Date.now()}`,
        mainCategory: "Birthday Cakes",
        collectionCode: "G",
        designNumber: 99,
        catalogueCode: "TEST-G-99",
        description: "Special test floral birthday cake with butter cream piping",
        basePrice: new Prisma.Decimal("3500.00"),
        published: true,
        isActive: true,
        images: {
          create: [{ url: "https://example.com/test1.jpg", isPrimary: true, sortOrder: 0 }],
        },
      },
    });
    createdProductIds.push(p1.id);

    const p2 = await prisma.product.create({
      data: {
        name: "Test Mini Rose Cake",
        slug: `test-mini-rose-${Date.now()}`,
        mainCategory: "Mini Cakes",
        collectionCode: "M",
        designNumber: 88,
        catalogueCode: "TEST-M-88",
        description: "Special test miniature rose cake for small celebrations",
        basePrice: new Prisma.Decimal("2200.00"),
        published: true,
        isActive: true,
        images: {
          create: [{ url: "https://example.com/test2.jpg", isPrimary: true, sortOrder: 0 }],
        },
      },
    });
    createdProductIds.push(p2.id);

    const p3 = await prisma.product.create({
      data: {
        name: "Test New Design Celebration",
        slug: `test-new-design-${Date.now()}`,
        mainCategory: "Celebration Cakes",
        collectionCode: "ND",
        designNumber: 77,
        catalogueCode: "TEST-ND-77",
        description: "Special test modern tier cake with chocolate drip",
        basePrice: new Prisma.Decimal("5500.00"),
        published: true,
        isActive: true,
        images: {
          create: [{ url: "https://example.com/test3.jpg", isPrimary: true, sortOrder: 0 }],
        },
      },
    });
    createdProductIds.push(p3.id);
  });

  afterAll(async () => {
    if (createdProductIds.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: createdProductIds } },
      });
    }
  });

  it("filters products by mainCategory", async () => {
    const birthdayCakes = await ProductService.getPublishedProducts({
      category: "Birthday Cakes",
    });
    expect(birthdayCakes.some((c) => c.catalogueCode === "TEST-G-99")).toBe(true);
    expect(birthdayCakes.some((c) => c.catalogueCode === "TEST-M-88")).toBe(false);
  });

  it("filters products by collectionCode", async () => {
    const miniCakes = await ProductService.getPublishedProducts({
      collection: "M",
    });
    expect(miniCakes.some((c) => c.catalogueCode === "TEST-M-88")).toBe(true);
    expect(miniCakes.some((c) => c.catalogueCode === "TEST-G-99")).toBe(false);
  });

  it("finds product when searching by catalogue code variants", async () => {
    // Normal code search for seeded G-43 cake
    const searchResult1 = await ProductService.getPublishedProducts({
      search: "G-43",
    });
    expect(searchResult1.some((c) => c.catalogueCode === "G-43")).toBe(true);

    // Searching unhyphenated code "G43"
    const searchResult2 = await ProductService.getPublishedProducts({
      search: "G43",
    });
    expect(searchResult2.some((c) => c.catalogueCode === "G-43")).toBe(true);

    // Searching with spaces "g 43"
    const searchResult3 = await ProductService.getPublishedProducts({
      search: "g 43",
    });
    expect(searchResult3.some((c) => c.catalogueCode === "G-43")).toBe(true);
  });

  it("sorts products by price ascending and descending", async () => {
    const asc = await ProductService.getPublishedProducts({ sort: "price_asc" });
    for (let i = 0; i < asc.length - 1; i++) {
      expect(Number(asc[i].basePrice)).toBeLessThanOrEqual(Number(asc[i + 1].basePrice));
    }

    const desc = await ProductService.getPublishedProducts({ sort: "price_desc" });
    for (let i = 0; i < desc.length - 1; i++) {
      expect(Number(desc[i].basePrice)).toBeGreaterThanOrEqual(Number(desc[i + 1].basePrice));
    }
  });

  it("prevents creating a product with an already existing catalogue code", async () => {
    // "G-43" is already seeded in the database
    await expect(
      ProductService.createProduct({
        collectionCode: "G",
        designNumber: 43,
        description: "Attempting to create duplicate G-43 cake",
        basePrice: 3800,
        published: true,
        images: [{ url: "https://example.com/test.jpg", isPrimary: true }],
        customizationGroups: [],
      })
    ).rejects.toThrow("G-43 already exists. Choose another design number.");
  });

  it("auto-generates name and slug if omitted when collection & design number are provided", async () => {
    await prisma.product.deleteMany({
      where: { catalogueCode: "P-99" },
    });

    const created = await ProductService.createProduct({
      collectionCode: "P",
      designNumber: 99,
      description: "Parchment cake with omitted name to test fallback",
      basePrice: 4000,
      published: false,
      images: [{ url: "https://example.com/test-p.jpg", isPrimary: true }],
      customizationGroups: [],
    });
    createdProductIds.push(created.id);

    expect(created.name).toBe("Wasana Cake P-99");
    expect(created.slug).toBe("p-99");
    expect(created.catalogueCode).toBe("P-99");
  });
});
