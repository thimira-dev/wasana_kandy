import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma";
import { OrderService } from "../lib/services/order-service";
import { getEarliestReadyDate } from "../lib/domain/date-rules";
import { Prisma, CustomizationFieldType } from "@prisma/client";

describe("OrderService Integration & Security Tests", () => {
  let testBranchId: string;
  let inactiveBranchId: string;
  let testProductId: string;
  let sizeGroupId: string;
  let opt1kgId: string;
  let opt2kgId: string;
  let inactiveOptId: string;

  beforeAll(async () => {
    // 1. Create active test branch
    const branch = await prisma.branch.create({
      data: {
        code: `TEST-BRANCH-${Date.now()}`,
        name: "Test Branch Active",
        address: "123 Test St, Kandy",
        phone: "0812234567",
        isActive: true,
      },
    });
    testBranchId = branch.id;

    // 2. Create inactive test branch
    const inactiveBranch = await prisma.branch.create({
      data: {
        code: `TEST-INACTIVE-${Date.now()}`,
        name: "Test Branch Inactive",
        address: "Closed St, Kandy",
        phone: "0812234567",
        isActive: false,
      },
    });
    inactiveBranchId = inactiveBranch.id;

    // 3. Create test product with active and inactive options
    const product = await prisma.product.create({
      data: {
        name: "Test Berry Cake",
        slug: `test-berry-cake-${Date.now()}`,
        description: "Fresh strawberry sponge cake.",
        basePrice: new Prisma.Decimal("4000.00"),
        published: true,
        isActive: true,
        images: {
          create: [{ url: "https://example.com/test-cake.jpg", isPrimary: true, sortOrder: 0 }],
        },
        customizationGroups: {
          create: [
            {
              name: "Cake Size",
              fieldType: CustomizationFieldType.SINGLE_SELECT,
              isRequired: true,
              sortOrder: 0,
              isActive: true,
              options: {
                create: [
                  { label: "1 kg", priceAdjustment: new Prisma.Decimal("0.00"), sortOrder: 0, isActive: true },
                  { label: "2 kg", priceAdjustment: new Prisma.Decimal("1500.00"), sortOrder: 1, isActive: true },
                  { label: "3 kg (Disabled)", priceAdjustment: new Prisma.Decimal("3000.00"), sortOrder: 2, isActive: false },
                ],
              },
            },
            {
              name: "Message",
              fieldType: CustomizationFieldType.TEXT,
              isRequired: false,
              sortOrder: 1,
              isActive: true,
              maxCharacters: 30,
            },
          ],
        },
      },
      include: {
        customizationGroups: {
          include: { options: true },
        },
      },
    });

    testProductId = product.id;
    const sizeGroup = product.customizationGroups.find((g) => g.name === "Cake Size")!;
    sizeGroupId = sizeGroup.id;
    opt1kgId = sizeGroup.options.find((o) => o.label === "1 kg")!.id;
    opt2kgId = sizeGroup.options.find((o) => o.label === "2 kg")!.id;
    inactiveOptId = sizeGroup.options.find((o) => o.label === "3 kg (Disabled)")!.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.order.deleteMany({
      where: {
        OR: [{ branchId: testBranchId }, { branchId: inactiveBranchId }],
      },
    });
    await prisma.product.deleteMany({ where: { id: testProductId } });
    await prisma.branch.deleteMany({
      where: { id: { in: [testBranchId, inactiveBranchId] } },
    });
  });

  it("creates a valid pending order with PAYMENT_PENDING and PENDING payment status", async () => {
    const readyDate = getEarliestReadyDate();

    const order = await OrderService.createPendingOrder({
      customerName: "Kamal Gunaratne",
      customerEmail: "kamal@example.com",
      phonePrimary: "0771234567",
      branchId: testBranchId,
      readyDate,
      productId: testProductId,
      selections: {
        [sizeGroupId]: { optionId: opt1kgId },
      },
    });

    expect(order.orderNumber).toMatch(/^WB-\d{8}-[A-Z0-9]{4}$/);
    expect(order.orderStatus).toBe("PAYMENT_PENDING");
    expect(order.paymentStatus).toBe("PENDING");
    expect(order.total.toFixed(2)).toBe("4000.00");
    expect(order.items.length).toBe(1);
    expect(order.items[0].productNameSnapshot).toBe("Test Berry Cake");
    expect(order.items[0].basePriceSnapshot.toFixed(2)).toBe("4000.00");
  });

  it("rejects an inactive branch", async () => {
    await expect(
      OrderService.createPendingOrder({
        customerName: "Kamal Gunaratne",
        customerEmail: "kamal@example.com",
        phonePrimary: "0771234567",
        branchId: inactiveBranchId,
        readyDate: getEarliestReadyDate(),
        productId: testProductId,
        selections: {
          [sizeGroupId]: { optionId: opt1kgId },
        },
      })
    ).rejects.toThrow("The selected pickup branch is invalid or unavailable.");
  });

  it("rejects when required customization option is missing", async () => {
    await expect(
      OrderService.createPendingOrder({
        customerName: "Kamal Gunaratne",
        customerEmail: "kamal@example.com",
        phonePrimary: "0771234567",
        branchId: testBranchId,
        readyDate: getEarliestReadyDate(),
        productId: testProductId,
        selections: {}, // empty selections
      })
    ).rejects.toThrow('Please select an option for "Cake Size".');
  });

  it("rejects an inactive customization option", async () => {
    await expect(
      OrderService.createPendingOrder({
        customerName: "Kamal Gunaratne",
        customerEmail: "kamal@example.com",
        phonePrimary: "0771234567",
        branchId: testBranchId,
        readyDate: getEarliestReadyDate(),
        productId: testProductId,
        selections: {
          [sizeGroupId]: { optionId: inactiveOptId }, // inactive option
        },
      })
    ).rejects.toThrow('Selected option for "Cake Size" is invalid or unavailable.');
  });

  it("ignores any client-supplied price attempt and authoritatively calculates server price", async () => {
    const maliciousPayload = {
      customerName: "Hacker Client",
      customerEmail: "hacker@example.com",
      phonePrimary: "0771234567",
      branchId: testBranchId,
      readyDate: getEarliestReadyDate(),
      productId: testProductId,
      selections: {
        [sizeGroupId]: { optionId: opt2kgId }, // +1500 LKR
      },
      // Client maliciously attempts to inject low prices:
      total: 100,
      subtotal: 50,
      price: 1,
    };

    const order = await OrderService.createPendingOrder(maliciousPayload);

    // Must be base 4000 + 1500 = 5500 LKR, completely ignoring client price
    expect(order.subtotal.toFixed(2)).toBe("4000.00");
    expect(order.customizationTotal.toFixed(2)).toBe("1500.00");
    expect(order.total.toFixed(2)).toBe("5500.00");
  });

  it("preserves exact snapshots even if product details change later", async () => {
    const order = await OrderService.createPendingOrder({
      customerName: "Snapshot Customer",
      customerEmail: "snapshot@example.com",
      phonePrimary: "0771234567",
      branchId: testBranchId,
      readyDate: getEarliestReadyDate(),
      productId: testProductId,
      selections: {
        [sizeGroupId]: { optionId: opt2kgId },
      },
    });

    const orderItem = order.items[0];
    expect(orderItem.basePriceSnapshot.toFixed(2)).toBe("4000.00");
    const customization = orderItem.customizations[0];
    expect(customization.priceAdjustmentSnapshot.toFixed(2)).toBe("1500.00");
    expect(customization.optionLabelSnapshot).toBe("2 kg");

    // Now mutate product in the database (e.g. price increase to 8000 LKR)
    await prisma.product.update({
      where: { id: testProductId },
      data: {
        name: "Renamed Berry Cake",
        basePrice: new Prisma.Decimal("8000.00"),
      },
    });

    // Re-fetch order: snapshots must NOT have mutated!
    const reloaded = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: { include: { customizations: true } } },
    });

    expect(reloaded?.items[0].productNameSnapshot).toBe("Test Berry Cake");
    expect(reloaded?.items[0].basePriceSnapshot.toFixed(2)).toBe("4000.00");
    expect(reloaded?.total.toFixed(2)).toBe("5500.00");
  });

  it("protects against duplicate submissions using idempotency key", async () => {
    const idempotencyKey = `idempotency-test-${Date.now()}`;
    const payload = {
      customerName: "Duplicate Test",
      customerEmail: "dup@example.com",
      phonePrimary: "0771234567",
      branchId: testBranchId,
      readyDate: getEarliestReadyDate(),
      productId: testProductId,
      selections: {
        [sizeGroupId]: { optionId: opt1kgId },
      },
      idempotencyKey,
    };

    // First call
    const order1 = await OrderService.createPendingOrder(payload);

    // Second call with same idempotencyKey (e.g. double-click)
    const order2 = await OrderService.createPendingOrder(payload);

    // Must return the exact same order without creating a second record
    expect(order1.id).toBe(order2.id);
    expect(order1.orderNumber).toBe(order2.orderNumber);

    const count = await prisma.order.count({
      where: { idempotencyKey },
    });
    expect(count).toBe(1);
  });
});
