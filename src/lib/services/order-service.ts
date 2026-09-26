import { prisma } from "@/lib/prisma";
import { Prisma, OrderStatus, PaymentStatus } from "@prisma/client";
import { CreateOrderInput, createOrderSchema, validateCustomerSelections } from "@/lib/domain/validation";
import { validateReadyDate, getSriLankaDateParts } from "@/lib/domain/date-rules";
import { calculateCustomizedPrice, centsToDecimalString } from "@/lib/domain/pricing";
import crypto from "crypto";

export class OrderService {
  /**
   * Generates a unique, human-readable order number.
   * Format: WB-YYYYMMDD-XXXX (e.g. WB-20260926-0041 or 4 alphanumeric chars)
   */
  static async generateOrderNumber(tx: Prisma.TransactionClient = prisma): Promise<string> {
    const { year, month, day } = getSriLankaDateParts();
    const dateStr = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;

    for (let attempts = 0; attempts < 10; attempts++) {
      // 4-character uppercase alphanumeric code
      const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
      const orderNumber = `WB-${dateStr}-${randomSuffix}`;

      const existing = await tx.order.findUnique({
        where: { orderNumber },
        select: { id: true },
      });

      if (!existing) {
        return orderNumber;
      }
    }

    // Fallback timestamp suffix if collision
    return `WB-${dateStr}-${Date.now().toString().slice(-4)}`;
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
  static async createPendingOrder(rawInput: unknown) {
    const validated = createOrderSchema.parse(rawInput);

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
        return existingOrder;
      }
    }

    // 2. Validate Branch
    const branch = await prisma.branch.findUnique({
      where: { id: validated.branchId },
    });

    if (!branch || !branch.isActive) {
      throw new Error("The selected pickup branch is invalid or unavailable.");
    }

    // 3. Server-side Ready Date Validation (4-day minimum rule in Asia/Colombo)
    const dateCheck = validateReadyDate(validated.readyDate, new Date());
    if (!dateCheck.isValid) {
      throw new Error(dateCheck.error || "The selected cake ready date is invalid.");
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
      throw new Error("The selected cake is no longer available. Please select another cake.");
    }

    // 5. Server-side Customization Validation
    const customizationCheck = validateCustomerSelections(
      product.customizationGroups,
      validated.selections
    );

    if (!customizationCheck.isValid) {
      const firstError = Object.values(customizationCheck.errors)[0];
      throw new Error(firstError || "One of your customization choices is invalid. Please review your cake.");
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
            throw new Error(`The selected option for "${group.name}" is no longer available.`);
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
      const orderNumber = await this.generateOrderNumber(tx);
      const accessToken = crypto.randomBytes(16).toString("hex");

      // Parse ready date to UTC midnight Date
      const readyDateObj = new Date(`${validated.readyDate}T00:00:00.000Z`);

      const order = await tx.order.create({
        data: {
          orderNumber,
          idempotencyKey: validated.idempotencyKey || null,
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

  /**
   * Secure lookup for payment placeholder page using orderNumber and accessToken
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
}
