import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/domain/validation";

export interface CategoryWithCount {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
}

export class CategoryService {
  /**
   * Active categories ordered for dropdowns, navigation menus, and filter bars
   */
  static async listActiveCategories() {
    return await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    });
  }

  /**
   * All categories for the admin management screen, including inactive ones,
   * each annotated with the number of cakes currently assigned
   */
  static async getCategoriesWithProductCounts(): Promise<CategoryWithCount[]> {
    const rows = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    if (rows.length === 0) return [];

    const names = rows.map((r) => r.name);
    const counts = await prisma.product.groupBy({
      by: ["mainCategory"],
      where: {
        mainCategory: { in: names },
      },
      _count: { _all: true },
    });

    const countMap = new Map<string, number>();
    for (const c of counts) {
      if (c.mainCategory) countMap.set(c.mainCategory, c._count._all);
    }

    return rows.map((r) => ({
      ...r,
      productCount: countMap.get(r.name) ?? 0,
    }));
  }

  /**
   * Creates a new category appended at the end of the current ordering
   */
  static async createCategory(rawInput: unknown) {
    const { name } = categorySchema.parse(rawInput);

    const existing = await prisma.category.findUnique({
      where: { name },
    });
    if (existing) {
      throw new Error(`A category named "${name}" already exists.`);
    }

    const maxOrder = await prisma.category.aggregate({
      _max: { sortOrder: true },
    });

    return await prisma.category.create({
      data: {
        name,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
  }

  /**
   * Renames a category and re-assigns all cakes that referenced the old name
   * inside a single transaction, so the catalogue never shows a split state
   */
  static async updateCategory(id: string, rawInput: unknown) {
    const { name } = categorySchema.parse(rawInput);

    const current = await prisma.category.findUnique({
      where: { id },
    });
    if (!current) {
      throw new Error("Category not found");
    }

    if (current.name !== name) {
      const existing = await prisma.category.findUnique({
        where: { name },
      });
      if (existing) {
        throw new Error(`A category named "${name}" already exists.`);
      }
    }

    return await prisma.$transaction(async (tx) => {
      const category = await tx.category.update({
        where: { id },
        data: { name },
      });

      if (current.name !== name) {
        await tx.product.updateMany({
          where: { mainCategory: current.name },
          data: { mainCategory: name },
        });
      }

      return category;
    });
  }

  /**
   * Deletes a category. Cakes assigned to it are NOT destroyed — their
   * mainCategory reference is simply cleared so they show as unclassified
   * until the admin re-assigns them.
   */
  static async deleteCategory(id: string) {
    const current = await prisma.category.findUnique({
      where: { id },
    });
    if (!current) {
      throw new Error("Category not found");
    }

    return await prisma.$transaction(async (tx) => {
      const reassigned = await tx.product.updateMany({
        where: { mainCategory: current.name },
        data: { mainCategory: null },
      });
      await tx.category.delete({ where: { id } });
      return {
        id: current.id,
        name: current.name,
        unassignedCakes: reassigned.count,
      };
    });
  }
}
