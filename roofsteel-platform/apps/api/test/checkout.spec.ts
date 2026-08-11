// Checkout integration test (T.5) — verifies the OrdersService.createOrder flow:
//   - Rejects empty cart
//   - Requires either accountId or guestEmail
//   - Gateway-tier guard (PayJustNow is retail-only)
//   - Calculates freight (free delivery threshold + weight/province bands)
//   - Creates order with PENDING_PAYMENT status + locked-in line item prices
//   - Initialises the payment strategy and stores the paymentRef
//
// We mock the cart, prisma, inventory, and payment strategies, but test the REAL
// OrdersService code path — the business logic that ties them together.

import { Test } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { AccountType, FulfilmentType, OrderStatus, PaymentGateway, Province } from "@prisma/client";
import { OrdersService } from "../src/orders/orders.service";
import { PrismaService } from "../src/common/prisma.service";
import { CartService } from "../src/cart/cart.service";
import { InventoryService } from "../src/inventory/inventory.service";
import { PayFastStrategy } from "../src/orders/payments/payfast.strategy";
import { LulapayStrategy } from "../src/orders/payments/lulapay.strategy";
import { PayJustNowStrategy } from "../src/orders/payments/payjustnow.strategy";

function mockCart(items: any[]) {
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const totalWeightKg = items.reduce((s, i) => s + i.lineWeightKg, 0);
  return {
    getCartWithPricing: jest.fn().mockResolvedValue({
      items,
      subtotal,
      totalWeightKg,
    }),
  } as unknown as CartService;
}

function mockInventory() {
  return {
    reserveStock: jest.fn().mockResolvedValue(undefined),
  } as unknown as InventoryService;
}

function mockPrisma() {
  return {
    order: {
      create: jest.fn().mockImplementation((args: any) =>
        Promise.resolve({ id: "ord-1", orderNumber: "RS-TEST", ...args.data, items: [] })
      ),
      update: jest.fn().mockResolvedValue({}),
    },
  } as unknown as PrismaService;
}

function mockStrategy(gatewayName: string) {
  return {
    gatewayName,
    initialize: jest.fn().mockResolvedValue({
      gatewayReference: `ref-${gatewayName}`,
      redirectUrl: `https://example.com/${gatewayName}`,
      requiresRedirect: true,
    }),
    verify: jest.fn(),
    refund: jest.fn(),
  } as any;
}

describe("OrdersService — checkout flow", () => {
  let service: OrdersService;
  let cart: CartService;
  let prisma: PrismaService;
  let inventory: InventoryService;
  let payFast: any;
  let lulapay: any;
  let payJustNow: any;

  beforeEach(async () => {
    cart = mockCart([]);
    prisma = mockPrisma();
    inventory = mockInventory();
    payFast = mockStrategy("PAYFAST");
    lulapay = mockStrategy("LULAPAY");
    payJustNow = mockStrategy("PAYJUSTNOW");

    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: CartService, useValue: cart },
        { provide: InventoryService, useValue: inventory },
        { provide: PayFastStrategy, useValue: payFast },
        { provide: LulapayStrategy, useValue: lulapay },
        { provide: PayJustNowStrategy, useValue: payJustNow },
      ],
    }).compile();
    service = module.get(OrdersService);
  });

  const stockItem = (unitPrice: number, weightKg: number, qty = 1) => ({
    productId: "p-1",
    quantity: qty,
    pricing: { applicablePrice: unitPrice },
    product: { fulfilmentType: FulfilmentType.STOCK, leadTimeDays: 0, weightKgPerUnit: weightKg },
    lineTotal: unitPrice * qty,
    lineWeightKg: weightKg * qty,
    mtlGaugeMm: null,
    mtlProfile: null,
    mtlColour: null,
    mtlLengthMm: null,
    cutBendShapeCode: null,
  });

  it("rejects an order without accountId or guestEmail", async () => {
    (cart as any).getCartWithPricing.mockResolvedValue({ items: [stockItem(100, 5)], subtotal: 100, totalWeightKg: 5 });
    await expect(
      service.createOrder({ cartId: "c-1", gateway: PaymentGateway.PAYFAST, province: Province.KWAZULU_NATAL } as any)
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects an empty cart", async () => {
    (cart as any).getCartWithPricing.mockResolvedValue({ items: [], subtotal: 0, totalWeightKg: 0 });
    await expect(
      service.createOrder({ cartId: "c-1", guestEmail: "g@test.com", gateway: PaymentGateway.PAYFAST, province: Province.KWAZULU_NATAL } as any)
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects PayJustNow for a TRADE account (retail-only gateway)", async () => {
    (cart as any).getCartWithPricing.mockResolvedValue({ items: [stockItem(100, 5)], subtotal: 100, totalWeightKg: 5 });
    await expect(
      service.createOrder({ cartId: "c-1", guestEmail: "g@test.com", gateway: PaymentGateway.PAYJUSTNOW, province: Province.KWAZULU_NATAL } as any, AccountType.TRADE)
    ).rejects.toThrow("not available for TRADE tier");
  });

  it("creates an order in PENDING_PAYMENT status with locked line prices", async () => {
    const item = stockItem(140, 25);
    (cart as any).getCartWithPricing.mockResolvedValue({ items: [item], subtotal: 140, totalWeightKg: 25 });

    await service.createOrder({ cartId: "c-1", guestEmail: "g@test.com", gateway: PaymentGateway.PAYFAST, province: Province.KWAZULU_NATAL } as any);

    const createCall = (prisma as any).order.create.mock.calls[0][0];
    expect(createCall.data.status).toBe(OrderStatus.PENDING_PAYMENT);
    expect(createCall.data.items.create[0].unitPrice).toBe(140);
    expect(createCall.data.paymentGateway).toBe(PaymentGateway.PAYFAST);
  });

  it("applies free delivery for orders ≥R15,000 and ≤50kg", async () => {
    const item = stockItem(16000, 40);
    (cart as any).getCartWithPricing.mockResolvedValue({ items: [item], subtotal: 16000, totalWeightKg: 40 });

    await service.createOrder({ cartId: "c-1", guestEmail: "g@test.com", gateway: PaymentGateway.PAYFAST, province: Province.GAUTENG } as any);

    const createCall = (prisma as any).order.create.mock.calls[0][0];
    expect(createCall.data.freightCost).toBe(0);
    expect(createCall.data.total).toBe(16000);
  });

  it("does NOT give free delivery for heavy orders even if ≥R15,000", async () => {
    const item = stockItem(16000, 500);
    (cart as any).getCartWithPricing.mockResolvedValue({ items: [item], subtotal: 16000, totalWeightKg: 500 });

    await service.createOrder({ cartId: "c-1", guestEmail: "g@test.com", gateway: PaymentGateway.PAYFAST, province: Province.GAUTENG } as any);

    const createCall = (prisma as any).order.create.mock.calls[0][0];
    expect(createCall.data.freightCost).toBeGreaterThan(0);
  });

  it("initialises the payment strategy and stores the paymentRef", async () => {
    const item = stockItem(100, 25);
    (cart as any).getCartWithPricing.mockResolvedValue({ items: [item], subtotal: 100, totalWeightKg: 25 });

    await service.createOrder({ cartId: "c-1", guestEmail: "g@test.com", gateway: PaymentGateway.PAYFAST, province: Province.KWAZULU_NATAL } as any);

    expect(payFast.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ total: expect.any(Number), guestEmail: "g@test.com" })
    );
    expect((prisma as any).order.update).toHaveBeenCalledWith({
      where: { id: "ord-1" },
      data: { paymentRef: "ref-PAYFAST" },
    });
  });

  it("reserves stock for STOCK-fulfilment items after order creation", async () => {
    const item = stockItem(100, 25, 3);
    (cart as any).getCartWithPricing.mockResolvedValue({ items: [item], subtotal: 100, totalWeightKg: 25 });

    await service.createOrder({ cartId: "c-1", guestEmail: "g@test.com", gateway: PaymentGateway.PAYFAST, province: Province.KWAZULU_NATAL } as any);

    expect(inventory.reserveStock).toHaveBeenCalled();
  });
});
