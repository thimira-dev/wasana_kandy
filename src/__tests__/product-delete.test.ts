import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma";
import { ProductService } from "../lib/services/product-service";
import { Prisma } from "@prisma/client";

describe("ProductService.deleteProduct", () => {
  const reference = Date.now();
  const testSlug = `deletion-test-cake-${reference}`;
  const testCode = `TD${reference}`;

  let productId: string;

  beforeAll(async () => {
    await prisma.product.deleteMany({
      where: {
        OR: [{ catalogueCode: testCode }, { slug: { startsWith: "deletion-test-cake-" } }],
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Deletion Test Cake",
        slug: testSlug,
        collectionCode: "TD",
        designNumber: 9 + (reference % 90),
        catalogueCode: testCode,
        description: "Cake created to verify permanent deletion behaviour",
        basePrice: new Prisma.Decimal("4300.00"),
        images: {
          create: [{ url: "https://example.com/delete-test.jpg", isPrimary: true }],
        },
        customizationGroups: {
          create: [
            {
              name: "Size",
              fieldType: "SINGLE_SELECT",
              options: {
                create: [{ label: "1kg", priceAdjustment: new Prisma.Decimal("0.00") }],
              },
            },
          ],
        },
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { id: productId } });
  });

  it("returns null when the product does not exist", async () => {
    const result = await ProductService.deleteProduct("non-existent-id");
    expect(result).toBeNull();
  });

  it("permanently deletes the cake together with its attachments", async () => {
    const before = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        images: true,
        customizationGroups: true,
      },
    });
    expect(before?.images).toHaveLength(1);
    expect(before?.customizationGroups).toHaveLength(1);

    const result = await ProductService.deleteProduct(productId);
    expect(result?.id).toBe(productId);
    expect(result?.name).toBe("Deletion Test Cake");

    const gone = await prisma.product.findUnique({ where: { id: productId } });
    expect(gone).toBeNull();

    // Cascade: attachments removed, no orphaned rows left behind
    const imagesLeft = await prisma.productImage.count({
      where: { productId },
    });
    const groupsLeft = await prisma.customizationGroup.count({
      where: { productId },
    });
    expect(imagesLeft).toBe(0);
    expect(groupsLeft).toBe(0);
  });
});
