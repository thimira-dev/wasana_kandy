import { prisma } from "@/lib/prisma";
import { collectionSchema } from "@/lib/domain/validation";

export interface CollectionWithCount {
  id: string;
  code: string;
  name: string;
  isSeasonal: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
}

export class CollectionService {
  /**
   * Active collections ordered for dropdowns and filter bars.
   * `isSeasonal` is included so the product form can auto-check
   * the seasonal flag when a seasonal collection is picked.
   */
  static async listActiveCollections() {
    return await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        isSeasonal: true,
      },
    });
  }

  /**
   * All collections for the admin management screen, including inactive ones,
   * each annotated with the number of cakes using that collection code
   */
  static async getCollectionsWithProductCounts(): Promise<CollectionWithCount[]> {
    const rows = await prisma.collection.findMany({
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    });

    if (rows.length === 0) return [];

    const codes = rows.map((r) => r.code);
    const counts = await prisma.product.groupBy({
      by: ["collectionCode"],
      where: {
        collectionCode: { in: codes },
      },
      _count: { _all: true },
    });

    const countMap = new Map<string, number>();
    for (const c of counts) {
      if (c.collectionCode) countMap.set(c.collectionCode, c._count._all);
    }

    return rows.map((r) => ({
      ...r,
      productCount: countMap.get(r.code) ?? 0,
    }));
  }

  /**
   * Creates a new collection code appended at the end of the current ordering
   */
  static async createCollection(rawInput: unknown) {
    const { code, name, isSeasonal } = collectionSchema.parse(rawInput);

    const existing = await prisma.collection.findUnique({
      where: { code },
    });
    if (existing) {
      throw new Error(`Collection code "${code}" is already in use.`);
    }

    const maxOrder = await prisma.collection.aggregate({
      _max: { sortOrder: true },
    });

    return await prisma.collection.create({
      data: {
        code,
        name,
        isSeasonal,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
  }

  /**
   * Updates a collection. If the code changes, all cakes stamped with the old
   * code are re-assigned in the same transaction so catalogue codes stay consistent.
   */
  static async updateCollection(id: string, rawInput: unknown) {
    const { code, name, isSeasonal } = collectionSchema.parse(rawInput);

    const current = await prisma.collection.findUnique({
      where: { id },
    });
    if (!current) {
      throw new Error("Collection not found");
    }

    if (current.code !== code) {
      const existing = await prisma.collection.findUnique({
        where: { code },
      });
      if (existing) {
        throw new Error(`Collection code "${code}" is already in use.`);
      }
    }

    return await prisma.$transaction(async (tx) => {
      const collection = await tx.collection.update({
        where: { id },
        data: { code, name, isSeasonal },
      });

      if (current.code !== code) {
        await tx.product.updateMany({
          where: { collectionCode: current.code },
          data: { collectionCode: code },
        });
      }

      return collection;
    });
  }

  /**
   * Deletes a collection code. Cakes using the code are NOT destroyed — their
   * collectionCode is simply cleared, leaving the cakes otherwise intact.
   */
  static async deleteCollection(id: string) {
    const current = await prisma.collection.findUnique({
      where: { id },
    });
    if (!current) {
      throw new Error("Collection not found");
    }

    return await prisma.$transaction(async (tx) => {
      const unassigned = await tx.product.updateMany({
        where: { collectionCode: current.code },
        data: { collectionCode: null },
      });
      await tx.collection.delete({ where: { id } });
      return {
        id: current.id,
        code: current.code,
        name: current.name,
        unassignedCakes: unassigned.count,
      };
    });
  }
}
