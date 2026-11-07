import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma";
import { CategoryService } from "../lib/services/category-service";
import { Prisma } from "@prisma/client";

describe("CategoryService", () => {
  const reference = Date.now().toString();
  const testCategoryName = `CatSvc Ref ${reference}`;

  let categoryId: string;
  let productId: string;

  beforeAll(async () => {
    // Clean any leftovers from previous runs of this suite
    await prisma.category.deleteMany({ where: { name: testCategoryName } });
    const category = await prisma.category.create({
      data: { name: testCategoryName, sortOrder: 999 },
    });
    categoryId = category.id;

    const createdAt = new Date();
    await prisma.product.deleteMany({
      where: { name: "Category Test Cake", createdAt: { gte: new Date(createdAt.getTime() - 60_000) } },
    });
    const product = await prisma.product.create({
      data: {
        name: "Category Test Cake",
        slug: `category-test-cake-${reference}`,
        mainCategory: testCategoryName,
        description: "Cake used to verify category service behaviour",
        basePrice: new Prisma.Decimal("1500.00"),
        images: {
          create: [{ url: "https://example.com/cat-test.jpg", isPrimary: true }],
        },
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.category.deleteMany({
      where: { name: { startsWith: "CatSvc Ref " } },
    });
  });

  it("creates a category with a unique name", async () => {
    const name = `CatSvc Create ${reference}`;
    const created = await CategoryService.createCategory({ name });
    expect(created.name).toBe(name);
  });

  it("rejects creating a category that already exists", async () => {
    await expect(
      CategoryService.createCategory({ name: testCategoryName })
    ).rejects.toThrow(`A category named "${testCategoryName}" already exists.`);
  });

  it("reports cake counts for managed categories", async () => {
    const categories = await CategoryService.getCategoriesWithProductCounts();
    const found = categories.find((c) => c.id === categoryId);
    expect(found?.productCount).toBe(1);
  });

  it("renames a category and re-assigns its cakes in one transaction", async () => {
    const newName = `CatSvc Renamed ${reference}`;
    const updated = await CategoryService.updateCategory(categoryId, {
      name: newName,
    });

    expect(updated.name).toBe(newName);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { mainCategory: true },
    });
    expect(product?.mainCategory).toBe(newName);

    // Point the suite reference back at the renamed category for the delete test
    categoryId = updated.id;
  });

  it("rejects renaming to a name that already exists", async () => {
    const first = await CategoryService.createCategory({
      name: `CatSvc Dupe A ${reference}`,
    });
    const second = await CategoryService.createCategory({
      name: `CatSvc Dupe B ${reference}`,
    });

    await expect(
      CategoryService.updateCategory(second.id, { name: first.name })
    ).rejects.toThrow(`A category named "${first.name}" already exists.`);
  });

  it("deletes a category and unassigns its cakes without deleting them", async () => {
    const result = await CategoryService.deleteCategory(categoryId);
    expect(result.unassignedCakes).toBe(1);

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    expect(category).toBeNull();

    // The cake itself is untouched, only its category reference is cleared
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { mainCategory: true, name: true },
    });
    expect(product?.mainCategory).toBeNull();
    expect(product?.name).toBe("Category Test Cake");
  });
});
