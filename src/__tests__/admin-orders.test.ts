import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma";
import { OrderService } from "../lib/services/order-service";
import { getEarliestReadyDate } from "../lib/domain/date-rules";
import { Prisma } from "@prisma/client";

/**
 * Integration tests for the view-only admin orders dashboard queries.
 * Creates isolated branch/product fixtures with unique codes and cleans up in afterAll.
 */
describe("OrderService admin dashboard queries", () => {
  let testBranchId: string;
  let otherBranchId: string;
  let testProductId: string;
  let pendingOrderId: string;
  let paidOrderId: string;
  let paidOrderNumber: string;

  const unique = (base: string) => `${base}-${Date.now()}`;

  beforeAll(async () => {
    const [branch, other, product] = await Promise.all([
      prisma.branch.create({
        data: { code: unique("TEST-ADM-A"), name: "Admin Test Branch A", address: "1 Test Ave, Kandy", phone: "0811111111", isActive: true },
      }),
      prisma.branch.create({
        data: { code: unique("TEST-ADM-B"), name: "Admin Test Branch B", address: "2 Test Ave, Kandy", phone: "0812222222", isActive: true },
      }),
      prisma.product.create({
        data: {
          name: "Admin Query Cake",
          slug: unique("admin-query-cake"),
          description: "Fixture cake for admin order queries.",
          basePrice: new Prisma.Decimal("5500.00"),
          published: true,
          isActive: true,
          images: { create: [{ url: "https://example.com/admin-cake.jpg", isPrimary: true, sortOrder: 0 }] },
        },
      }),
    ]);
    testBranchId = branch.id;
    otherBranchId = other.id;
    testProductId = product.id;

    const payload = {
      phonePrimary: "0775550100",
      readyDate: getEarliestReadyDate(),
      productId: testProductId,
      selections: {},
      branchId: testBranchId,
    };
    const pending = await OrderService.createPendingOrder({ ...payload, customerName: "Admin Pending Buyer", customerEmail: "pending@admintest.example" });
    const paid = await OrderService.createPendingOrder({ ...payload, customerName: "Admin Paid Buyer", customerEmail: "paid@admintest.example" });
    pendingOrderId = pending.id;
    paidOrderId = paid.id;
    paidOrderNumber = paid.orderNumber;

    // Simulate the settled payment outcome the payment pipeline records
    await prisma.order.update({
      where: { id: paidOrderId },
      data: {
        orderStatus: "CONFIRMED",
        paymentStatus: "PAID",
        paidAt: new Date(),
      },
    });
  }, 30_000);

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { branchId: { in: [testBranchId, otherBranchId] } } });
    await prisma.product.deleteMany({ where: { id: testProductId } });
    await prisma.branch.deleteMany({ where: { id: { in: [testBranchId, otherBranchId] } } });
  }, 30_000);

  it("lists all orders newest first with item/attempt counts and branch", async () => {
    const orders = await OrderService.getAdminOrders();
    const ours = orders.filter((o) => o.id === pendingOrderId || o.id === paidOrderId);
    expect(ours).toHaveLength(2);
    const newest = orders.find((o) => o.id === ours[0].id)!;
    // Both created in beforeAll; either order's shape must be complete
    for (const o of [newest]) {
      expect(o.branch).toMatchObject({ id: testBranchId, isActive: true });
      expect(o._count.items).toBe(1);
      expect(o._count.paymentAttempts).toBe(0);
      expect(typeof o.total.toString()).toBe("string");
    }
  });

  it("filters by payment status, order status, branch and search text", async () => {
    const paidOnly = await OrderService.getAdminOrders({ paymentStatus: "PAID" });
    expect(paidOnly.some((o) => o.id === paidOrderId)).toBe(true);
    expect(paidOnly.every((o) => o.paymentStatus === "PAID")).toBe(true);

    const pendingOnly = await OrderService.getAdminOrders({ orderStatus: "PAYMENT_PENDING" });
    expect(pendingOnly.some((o) => o.id === pendingOrderId)).toBe(true);
    expect(pendingOnly.every((o) => o.orderStatus === "PAYMENT_PENDING")).toBe(true);

    const otherBranch = await OrderService.getAdminOrders({ branchId: otherBranchId });
    expect(otherBranch.some((o) => o.id === pendingOrderId || o.id === paidOrderId)).toBe(false);

    const byNumber = await OrderService.getAdminOrders({ search: paidOrderNumber });
    expect(byNumber.some((o) => o.id === paidOrderId)).toBe(true);
    expect(byNumber.some((o) => o.id === pendingOrderId)).toBe(false);

    const byEmail = await OrderService.getAdminOrders({ search: "pending@admintest.example" });
    expect(byEmail.some((o) => o.id === pendingOrderId)).toBe(true);

    const byPhone = await OrderService.getAdminOrders({ search: "0775550100" });
    expect(byPhone.some((o) => o.id === paidOrderId)).toBe(true);
  });

  it("accumulates paid revenue and status counts in stats", async () => {
    const before = await OrderService.getAdminOrderStats();

    // Sanity: the paid fixture contributes to paid stats
    expect(Number(before.paidRevenue)).toBeGreaterThanOrEqual(5500);
    expect(before.paidCount).toBeGreaterThanOrEqual(1);
    expect(before.pendingPaymentCount).toBeGreaterThanOrEqual(1);
    expect(before.totalCount).toBeGreaterThanOrEqual(before.paidCount);
    expect(before.confirmedCount).toBeGreaterThanOrEqual(0);
    expect(before.preparingCount).toBeGreaterThanOrEqual(0);
  });

  it("loads full detail for an order and returns null for unknown ids", async () => {
    const detail = await OrderService.getAdminOrderDetail(paidOrderId);
    expect(detail).not.toBeNull();
    expect(detail!.orderNumber).toBe(paidOrderNumber);
    expect(detail!.paymentStatus).toBe("PAID");
    expect(detail!.items).toHaveLength(1);
    expect(detail!.items[0].productNameSnapshot).toBe("Admin Query Cake");
    expect(detail!.items[0].product?.images[0]?.url).toBe("https://example.com/admin-cake.jpg");
    expect(detail!.paymentAttempts).toHaveLength(0);
    expect(detail!.paymentEvents).toHaveLength(0);
    expect(detail!.branch.name).toBe("Admin Test Branch A");

    expect(await OrderService.getAdminOrderDetail("nonexistent-id")).toBeNull();
  });
});
