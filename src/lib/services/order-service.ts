import { prisma } from "@/lib/prisma";
import { Prisma, OrderStatus, PaymentStatus } from "@prisma/client";
import { createOrderSchema, validateCustomerSelections } from "@/lib/domain/validation";
import { validateReadyDate, getSriLankaDateParts } from "@/lib/domain/date-rules";
import { calculateCustomizedPrice, centsToDecimalString } from "@/lib/domain/pricing";
import crypto from "crypto";

export class OrderValidationError extends Error {}

function fingerprint(value: unknown): string {
  function canonical(input: unknown): unknown {
    if (Array.isArray(input)) return input.map(canonical);
    if (input && typeof input === "object") return Object.fromEntries(
      Object.entries(input).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])
    );
    return input;
  }
  return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

export class OrderService {
  /**
   * Generates a unique, human-readable order number.
   * Format: WB-YYYYMMDD-XXXXXXXX (eight random hexadecimal characters)
   */
  static async generateOrderNumber(tx: Prisma.TransactionClient = prisma): Promise<string> {
    const { year, month, day } = getSriLankaDateParts();
    const dateStr = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;

    for (let attempts = 0; attempts < 10; attempts++) {
      // Eight hexadecimal characters avoid frequent collisions as daily order volume grows.
      const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
      const orderNumber = `WB-${dateStr}-${randomSuffix}`;

      const existing = await tx.order.findUnique({
        where: { orderNumber },
        select: { id: true },
      });

      if (!existing) {
        return orderNumber;
      }
    }

    return `WB-${dateStr}-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
  }

  /**
   * Fetches all active branches for checkout selection
   */
  static async getActiveBranches() {
    return await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Creates a pending order atomically with authoritative server-side validation & pricing.
   */
  static async createPendingOrder(rawInput: unknown, ownerToken?: string) {
    const validated = createOrderSchema.parse(rawInput);
    const { idempotencyKey: ignoredKey, ...requestData } = validated;
    void ignoredKey;
    const requestFingerprint = fingerprint(requestData);
    const checkoutOwnerHash = ownerToken && /^[0-9a-f]{64}$/.test(ownerToken)
      ? crypto.createHash("sha256").update(ownerToken).digest("hex") : null;
    if (validated.idempotencyKey && !checkoutOwnerHash) {
      throw new OrderValidationError("Please refresh checkout to establish your browser session.");
    }
    if (ownerToken && !validated.idempotencyKey) throw new OrderValidationError("An order retry key is required.");
    const assertRetry = <T extends { checkoutOwnerHash: string | null; requestFingerprint: string | null }>(existing: T): T => {
      if (existing.checkoutOwnerHash !== checkoutOwnerHash || existing.requestFingerprint !== requestFingerprint) {
        throw new OrderValidationError("This checkout retry does not match the original order. Please start a new checkout.");
      }
      return existing;
    };

    // 1. Idempotency Check: if idempotencyKey was already submitted, return existing order
    if (validated.idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey: validated.idempotencyKey },
        include: {
          items: {
            include: { customizations: true },
          },
          branch: true,
        },
      });

      if (existingOrder) {
        return assertRetry(existingOrder);
      }
    }

    // 2. Validate Branch
    const branch = await prisma.branch.findUnique({
      where: { id: validated.branchId },
    });

    if (!branch || !branch.isActive) {
      throw new OrderValidationError("The selected pickup branch is invalid or unavailable.");
    }

    // 3. Server-side Ready Date Validation (4-day minimum rule in Asia/Colombo)
    const dateCheck = validateReadyDate(validated.readyDate, new Date());
    if (!dateCheck.isValid) {
      throw new OrderValidationError(dateCheck.error || "The selected cake ready date is invalid.");
    }

    // 4. Validate Product Existence & Publication State
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
        customizationGroups: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            options: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!product || !product.isActive || !product.published) {
      throw new OrderValidationError("The selected cake is no longer available. Please select another cake.");
    }

    // 5. Server-side Customization Validation
    const customizationCheck = validateCustomerSelections(
      product.customizationGroups,
      validated.selections
    );

    if (!customizationCheck.isValid) {
      const firstError = Object.values(customizationCheck.errors)[0];
      throw new OrderValidationError(firstError || "One of your customization choices is invalid. Please review your cake.");
    }

    // 6. Authoritative Server-side Price Calculation
    // Never trust client prices: recalculate from database records
    const verifiedOptionAdjustments: Array<{
      groupName: string;
      fieldType: (typeof product.customizationGroups)[0]["fieldType"];
      groupId: string;
      optionId?: string;
      optionLabel?: string;
      textValue?: string;
      priceAdjustment: string | number;
    }> = [];

    for (const group of product.customizationGroups) {
      const userSelection = validated.selections[group.id];

      if (group.fieldType === "SINGLE_SELECT") {
        const optionId = userSelection?.optionId;
        if (optionId) {
          const matchedOpt = group.options.find((opt) => opt.id === optionId && opt.isActive);
          if (!matchedOpt) {
            throw new OrderValidationError(`The selected option for "${group.name}" is no longer available.`);
          }

          verifiedOptionAdjustments.push({
            groupName: group.name,
            fieldType: group.fieldType,
            groupId: group.id,
            optionId: matchedOpt.id,
            optionLabel: matchedOpt.label,
            priceAdjustment: matchedOpt.priceAdjustment.toString(),
          });
        }
      } else if (group.fieldType === "TEXT" || group.fieldType === "TEXTAREA") {
        const textVal = userSelection?.textValue?.trim() || "";
        verifiedOptionAdjustments.push({
          groupName: group.name,
          fieldType: group.fieldType,
          groupId: group.id,
          textValue: textVal,
          priceAdjustment: 0,
        });
      }
    }

    const priceResult = calculateCustomizedPrice(
      product.basePrice.toString(),
      verifiedOptionAdjustments.map((a) => ({ priceAdjustment: a.priceAdjustment }))
    );

    // Primary image snapshot
    const primaryImg = product.images.find((img) => img.isPrimary) || product.images[0];

    // 7. Atomic Database Transaction
    return await prisma.$transaction(async (tx) => {
      if (validated.idempotencyKey) {
        await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${validated.idempotencyKey}))`;
        const existing = await tx.order.findUnique({ where: { idempotencyKey: validated.idempotencyKey },
          include: { items: { include: { customizations: true } }, branch: true } });
        if (existing) return assertRetry(existing);
      }
      const orderNumber = await this.generateOrderNumber(tx);
      const accessToken = crypto.randomBytes(16).toString("hex");

      // Parse ready date to UTC midnight Date
      const readyDateObj = new Date(`${validated.readyDate}T00:00:00.000Z`);

      const order = await tx.order.create({
        data: {
          orderNumber,
          idempotencyKey: validated.idempotencyKey || null,
          checkoutOwnerHash,
          requestFingerprint,
          isTest: process.env.PAYMENT_MODE !== "live",
          accessToken,
          branchId: branch.id,
          customerName: validated.customerName,
          customerEmail: validated.customerEmail,
          phonePrimary: validated.phonePrimary,
          phoneSecondary: validated.phoneSecondary || null,
          readyDate: readyDateObj,
          subtotal: product.basePrice,
          customizationTotal: new Prisma.Decimal(centsToDecimalString(priceResult.adjustmentsCents)),
          total: new Prisma.Decimal(centsToDecimalString(priceResult.totalCents)),
          orderStatus: OrderStatus.PAYMENT_PENDING,
          paymentStatus: PaymentStatus.PENDING,
          items: {
            create: [
              {
                productId: product.id,
                productNameSnapshot: product.name,
                productSlugSnapshot: product.slug,
                basePriceSnapshot: product.basePrice,
                productImageSnapshot: primaryImg?.url || null,
                customizations: {
                  create: verifiedOptionAdjustments.map((adj) => ({
                    customizationGroupId: adj.groupId,
                    groupNameSnapshot: adj.groupName,
                    fieldTypeSnapshot: adj.fieldType,
                    selectedOptionId: adj.optionId || null,
                    optionLabelSnapshot: adj.optionLabel || null,
                    textValue: adj.textValue || null,
                    priceAdjustmentSnapshot: new Prisma.Decimal(adj.priceAdjustment.toString()),
                  })),
                },
              },
            ],
          },
        },
        include: {
          items: {
            include: { customizations: true },
          },
          branch: true,
        },
      });

      return order;
    });
  }

  static async getPaymentOrder(orderNumber: string, accessToken: string, db: Prisma.TransactionClient = prisma) {
    return db.order.findFirst({
      where: { orderNumber, accessToken },
      include: { branch: true, paymentAttempts: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
  }

  /**
   * Guest lookup using orderNumber and accessToken (tokens must never be placed in URLs)
   * (Prevents public customer enumeration attacks).
   */
  static async getOrderByNumberAndToken(orderNumber: string, accessToken: string) {
    return await prisma.order.findFirst({
      where: {
        orderNumber,
        accessToken,
      },
      include: {
        branch: true,
        items: {
          include: { customizations: true },
        },
      },
    });
  }

  /* ───────────────────────── ADMIN DASHBOARD (view-only) ───────────────────────── */

  static async getAdminOrders(filters?: {
    search?: string;
    paymentStatus?: string;
    orderStatus?: string;
    branchId?: string;
    page?: number;
  }) {
    const where: Prisma.OrderWhereInput = {};

    if (filters?.paymentStatus && filters.paymentStatus !== "all") {
      const match = Object.values(PaymentStatus).find((s) => s === filters.paymentStatus);
      if (match) where.paymentStatus = match;
    }
    if (filters?.orderStatus && filters.orderStatus !== "all") {
      const match = Object.values(OrderStatus).find((s) => s === filters.orderStatus);
      if (match) where.orderStatus = match;
    }
    if (filters?.branchId && filters.branchId !== "all") {
      where.branchId = filters.branchId;
    }

    const search = filters?.search?.trim().slice(0, 120);
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { phonePrimary: { contains: search } },
      ];
    }

    const page = Math.min(10000, Math.max(1, Math.floor(filters?.page || 1)));
    return await prisma.order.findMany({
      take: 51, // One extra row indicates that the next page exists.
      skip: (page - 1) * 50,
      where,
      include: {
        branch: true,
        _count: {
          select: {
            items: true,
            paymentAttempts: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  }

  static async getAdminOrderDetail(id: string) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        branch: true,
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            customizations: true,
            product: {
              select: {
                images: {
                  orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                  take: 1,
                },
              },
            },
          },
        },
        paymentAttempts: {
          orderBy: { createdAt: "desc" },
        },
        paymentEvents: {
          orderBy: { receivedAt: "desc" },
        },
      },
    });
  }

  static async getAdminOrderStats() {
    const [paidAggregate, pendingCount, confirmedCount, totalCount, preparingCount] = await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: "PAID", isTest: false },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.count({ where: { orderStatus: "PAYMENT_PENDING" } }),
      prisma.order.count({ where: { orderStatus: "CONFIRMED" } }),
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: "PREPARING" } }),
    ]);

    return {
      paidRevenue: paidAggregate._sum.total?.toString() ?? "0",
      paidCount: paidAggregate._count,
      pendingPaymentCount: pendingCount,
      confirmedCount,
      preparingCount,
      totalCount,
    };
  }
}
