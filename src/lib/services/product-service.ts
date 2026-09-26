import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/domain/validation";
import { generateCatalogueCode, normalizeCodeSearch } from "@/lib/domain/catalogue";
import { Prisma } from "@prisma/client";

export interface PublishedProductFilters {
  search?: string;
  collection?: string;
  category?: string;
  sort?: string;
}

export class ProductService {
  /**
   * Generates a clean, URL-safe slug from a product name
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Fetches published and active cakes for the public catalogue with optional search, category, collection, and sorting
   */
  static async getPublishedProducts(filters?: PublishedProductFilters) {
    const where: Prisma.ProductWhereInput = {
      published: true,
      isActive: true,
    };

    if (filters?.category && filters.category.trim().length > 0) {
      where.mainCategory = filters.category.trim();
    }

    if (filters?.collection && filters.collection.trim().length > 0) {
      where.collectionCode = filters.collection.trim().toUpperCase();
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.trim();
      const canonicalCode = normalizeCodeSearch(q);

      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { catalogueCode: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        ...(canonicalCode
          ? [{ catalogueCode: { equals: canonicalCode, mode: "insensitive" as const } }]
          : []),
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };

    if (filters?.sort === "price_asc") {
      orderBy = { basePrice: "asc" };
    } else if (filters?.sort === "price_desc") {
      orderBy = { basePrice: "desc" };
    } else if (filters?.sort === "name_asc") {
      orderBy = { name: "asc" };
    } else if (filters?.sort === "code_asc") {
      orderBy = { catalogueCode: "asc" };
    }

    return await prisma.product.findMany({
      where,
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
      },
      orderBy,
    });
  }

  /**
   * Fetches an individual published cake by its slug with its active customization groups and options
   */
  static async getProductBySlug(slug: string) {
    return await prisma.product.findFirst({
      where: {
        published: true,
        isActive: true,
        OR: [
          { slug },
          { catalogueCode: { equals: slug, mode: "insensitive" } },
        ],
      },
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
        customizationGroups: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
          include: {
            options: {
              where: {
                isActive: true,
              },
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
    });
  }

  /**
   * Fetches products for admin management table with optional search and collection filter
   */
  static async getAdminProducts(search?: string, collection?: string) {
    const where: Prisma.ProductWhereInput = {};

    if (collection && collection.trim().length > 0) {
      where.collectionCode = collection.trim().toUpperCase();
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      const canonicalCode = normalizeCodeSearch(q);

      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { catalogueCode: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        ...(canonicalCode
          ? [{ catalogueCode: { equals: canonicalCode, mode: "insensitive" as const } }]
          : []),
      ];
    }

    return await prisma.product.findMany({
      where,
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
        },
        _count: {
          select: {
            customizationGroups: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  /**
   * Fetches full product data by ID for admin edit form
   */
  static async getAdminProductById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
        customizationGroups: {
          orderBy: {
            sortOrder: "asc",
          },
          include: {
            options: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
    });
  }

  /**
   * Creates a new cake with images and customization groups/options in a single transaction
   */
  static async createProduct(rawInput: unknown) {
    const validated = productSchema.parse(rawInput);

    // Compute canonical catalogueCode if collectionCode and designNumber are provided
    let catalogueCode: string | null = null;
    if (validated.collectionCode && validated.designNumber !== null && validated.designNumber !== undefined) {
      catalogueCode = generateCatalogueCode(validated.collectionCode, validated.designNumber);
    } else if (validated.catalogueCode) {
      catalogueCode = validated.catalogueCode.trim().toUpperCase();
    }

    // Verify catalogueCode uniqueness
    if (catalogueCode) {
      const existingCode = await prisma.product.findUnique({
        where: { catalogueCode },
      });
      if (existingCode) {
        throw new Error(`${catalogueCode} already exists. Choose another design number.`);
      }
    }

    // Determine final name and slug
    const finalName =
      validated.name && validated.name.trim().length > 0
        ? validated.name.trim()
        : catalogueCode
        ? `Wasana Cake ${catalogueCode}`
        : "Wasana Celebration Cake";

    const baseSlug =
      validated.slug && validated.slug.trim().length > 0
        ? ProductService.generateSlug(validated.slug)
        : ProductService.generateSlug(catalogueCode || finalName);

    // Verify slug uniqueness
    const existingSlug = await prisma.product.findUnique({
      where: { slug: baseSlug },
    });

    if (existingSlug) {
      throw new Error(`A product with the slug "${baseSlug}" already exists.`);
    }

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: finalName,
          slug: baseSlug,
          mainCategory: validated.mainCategory || null,
          collectionCode: validated.collectionCode || null,
          designNumber: validated.designNumber ?? null,
          catalogueCode: catalogueCode || null,
          isSeasonal: validated.isSeasonal ?? false,
          shortDescription: validated.shortDescription || null,
          description: validated.description,
          basePrice: new Prisma.Decimal(validated.basePrice.toString()),
          published: validated.published,
          isActive: validated.isActive,
          images: {
            create: validated.images.map((img, idx) => ({
              url: img.url,
              altText: img.altText || finalName,
              isPrimary: img.isPrimary ?? (idx === 0),
              sortOrder: img.sortOrder ?? idx,
            })),
          },
        },
      });

      // Create customization groups and options
      for (let gIdx = 0; gIdx < validated.customizationGroups.length; gIdx++) {
        const group = validated.customizationGroups[gIdx];
        await tx.customizationGroup.create({
          data: {
            productId: product.id,
            name: group.name,
            fieldType: group.fieldType,
            isRequired: group.isRequired,
            sortOrder: group.sortOrder ?? gIdx,
            isActive: group.isActive ?? true,
            helperText: group.helperText || null,
            maxCharacters: group.maxCharacters || null,
            options: {
              create: group.options.map((opt, oIdx) => ({
                label: opt.label,
                priceAdjustment: new Prisma.Decimal(opt.priceAdjustment.toString()),
                sortOrder: opt.sortOrder ?? oIdx,
                isActive: opt.isActive ?? true,
              })),
            },
          },
        });
      }

      return product;
    });
  }

  /**
   * Updates an existing product, updating or re-syncing images and customization groups/options
   */
  static async updateProduct(id: string, rawInput: unknown) {
    const validated = productSchema.parse(rawInput);

    // Compute canonical catalogueCode if collectionCode and designNumber are provided
    let catalogueCode: string | null = null;
    if (validated.collectionCode && validated.designNumber !== null && validated.designNumber !== undefined) {
      catalogueCode = generateCatalogueCode(validated.collectionCode, validated.designNumber);
    } else if (validated.catalogueCode) {
      catalogueCode = validated.catalogueCode.trim().toUpperCase();
    }

    // Verify catalogueCode uniqueness against other products
    if (catalogueCode) {
      const existingCode = await prisma.product.findFirst({
        where: {
          catalogueCode,
          NOT: { id },
        },
      });
      if (existingCode) {
        throw new Error(`${catalogueCode} already exists. Choose another design number.`);
      }
    }

    // Determine final name and slug
    const finalName =
      validated.name && validated.name.trim().length > 0
        ? validated.name.trim()
        : catalogueCode
        ? `Wasana Cake ${catalogueCode}`
        : "Wasana Celebration Cake";

    const baseSlug =
      validated.slug && validated.slug.trim().length > 0
        ? ProductService.generateSlug(validated.slug)
        : ProductService.generateSlug(catalogueCode || finalName);

    // Verify slug uniqueness if slug changed
    const existingSlug = await prisma.product.findFirst({
      where: {
        slug: baseSlug,
        NOT: { id },
      },
    });

    if (existingSlug) {
      throw new Error(`Another product is already using the slug "${baseSlug}".`);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Update basic product info
      const product = await tx.product.update({
        where: { id },
        data: {
          name: finalName,
          slug: baseSlug,
          mainCategory: validated.mainCategory || null,
          collectionCode: validated.collectionCode || null,
          designNumber: validated.designNumber ?? null,
          catalogueCode: catalogueCode || null,
          isSeasonal: validated.isSeasonal ?? false,
          shortDescription: validated.shortDescription || null,
          description: validated.description,
          basePrice: new Prisma.Decimal(validated.basePrice.toString()),
          published: validated.published,
          isActive: validated.isActive,
        },
      });

      // 2. Re-sync images
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (validated.images.length > 0) {
        await tx.productImage.createMany({
          data: validated.images.map((img, idx) => ({
            productId: id,
            url: img.url,
            altText: img.altText || finalName,
            isPrimary: img.isPrimary ?? (idx === 0),
            sortOrder: img.sortOrder ?? idx,
          })),
        });
      }

      // 3. Re-sync customization groups and options
      await tx.customizationGroup.deleteMany({ where: { productId: id } });

      for (let gIdx = 0; gIdx < validated.customizationGroups.length; gIdx++) {
        const group = validated.customizationGroups[gIdx];
        await tx.customizationGroup.create({
          data: {
            productId: id,
            name: group.name,
            fieldType: group.fieldType,
            isRequired: group.isRequired,
            sortOrder: group.sortOrder ?? gIdx,
            isActive: group.isActive ?? true,
            helperText: group.helperText || null,
            maxCharacters: group.maxCharacters || null,
            options: {
              create: group.options.map((opt, oIdx) => ({
                label: opt.label,
                priceAdjustment: new Prisma.Decimal(opt.priceAdjustment.toString()),
                sortOrder: opt.sortOrder ?? oIdx,
                isActive: opt.isActive ?? true,
              })),
            },
          },
        });
      }

      return product;
    });
  }

  /**
   * Soft-deletes / toggles active status or published status of a product
   */
  static async toggleStatus(
    id: string,
    updates: { published?: boolean; isActive?: boolean }
  ) {
    return await prisma.product.update({
      where: { id },
      data: updates,
    });
  }
}
