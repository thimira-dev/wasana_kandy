import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma";
import { CollectionService } from "../lib/services/collection-service";
import { Prisma } from "@prisma/client";

describe.skipIf(!process.env.SECURITY_TEST_DATABASE_URL)("CollectionService", () => {
  const reference = Date.now().toString();
  // Codes must be letters only (same constraint as the real catalogue codes)
  const testCode = `TQ${"ABCDEFGHJKLMNPQRSTUVWXYZ"[Number(reference) % 23]}`;
  const testName = `ColSvc Ref ${reference}`;

  let collectionId: string;
  let productId: string;

  beforeAll(async () => {
    // Clean any leftovers from previous runs of this suite
    await prisma.collection.deleteMany({ where: { code: { startsWith: "TQ" } } });
    const collection = await prisma.collection.create({
      data: { code: testCode, name: testName, sortOrder: 999 },
    });
    collectionId = collection.id;

    await prisma.product.deleteMany({
      where: { slug: `collection-test-cake-${reference}` },
    });
    const product = await prisma.product.create({
      data: {
        name: "Collection Test Cake",
        slug: `collection-test-cake-${reference}`,
        collectionCode: testCode,
        isSeasonal: true,
        description: "Cake used to verify collection service behaviour",
        basePrice: new Prisma.Decimal("2750.00"),
        images: {
          create: [{ url: "https://example.com/col-test.jpg", isPrimary: true }],
        },
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.collection.deleteMany({ where: { code: { startsWith: "TQ" } } });
  });

  it("normalizes the code to uppercase and creates the collection", async () => {
    const created = await CollectionService.createCollection({
      code: `${testCode.toLowerCase()}u`,
      name: `ColSvc Create ${reference}`,
    });
    expect(created.code).toBe(`${testCode}U`);
    expect(created.name).toBe(`ColSvc Create ${reference}`);
  });

  it("rejects creating a collection whose code is already in use", async () => {
    await expect(
      CollectionService.createCollection({ code: testCode, name: testName })
    ).rejects.toThrow(`Collection code "${testCode}" is already in use.`);
  });

  it("reports cake counts and seasonal flag with collections", async () => {
    const collections = await CollectionService.getCollectionsWithProductCounts();
    const found = collections.find((c) => c.id === collectionId);
    expect(found?.productCount).toBe(1);
    expect(found?.isSeasonal).toBe(false);
  });

  it("updates code or seasonal flag and re-assigns remaining cakes", async () => {
    const updated = await CollectionService.updateCollection(collectionId, {
      code: `${testCode.toLowerCase()}r`,
      name: testName,
      isSeasonal: true,
    });

    expect(updated.code).toBe(`${testCode}R`);
    expect(updated.isSeasonal).toBe(true);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { collectionCode: true },
    });
    expect(product?.collectionCode).toBe(`${testCode}R`);

    // The product list stays intact for the delete test below
    collectionId = updated.id;
  });

  it("rejects updating to a code already owned by another collection", async () => {
    const first = await CollectionService.createCollection({
      code: `${testCode.toLowerCase()}a`,
      name: `ColSvc Dupe A ${reference}`,
    });
    const second = await CollectionService.createCollection({
      code: `${testCode.toLowerCase()}b`,
      name: `ColSvc Dupe B ${reference}`,
    });

    await expect(
      CollectionService.updateCollection(second.id, {
        code: first.code.toLowerCase(),
        name: first.name,
      })
    ).rejects.toThrow(`Collection code "${first.code}" is already in use.`);
  });

  it("deletes a collection and unassigns its cakes without deleting them", async () => {
    const result = await CollectionService.deleteCollection(collectionId);
    expect(result.unassignedCakes).toBe(1);

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });
    expect(collection).toBeNull();

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { collectionCode: true, isSeasonal: true },
    });
    expect(product?.collectionCode).toBeNull();
    // The product-level seasonal flag is independent and remains untouched
    expect(product?.isSeasonal).toBe(true);
  });
});
