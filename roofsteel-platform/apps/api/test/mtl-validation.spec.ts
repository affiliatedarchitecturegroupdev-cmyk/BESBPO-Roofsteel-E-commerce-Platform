// Made-to-Length validation tests — verifies the server-side validation rules in
// CartService.validateFulfilmentInputs:
//   1. MTL products require mtl config (gauge, profile, colour, length)
//   2. mtl.lengthMm must not exceed MAX_MTL_LENGTH_MM (13,200mm)
//   3. STOCK products don't require mtl config
//   4. FABRICATED_TO_ORDER products don't strictly require cutBendShapeCode
//
// We test the real CartService code path through addItem, mocking PrismaService.
// Per guidelines/04-made-to-length-configurator.md — server-side validation is mandatory
// even though the frontend also validates.

import { Test } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { FulfilmentType } from "@prisma/client";
import { CartService } from "../src/cart/cart.service";
import { PrismaService } from "../src/common/prisma.service";
import { PricingService } from "../src/pricing/pricing.service";

function mockPrisma(product: any): PrismaService {
  const prisma = {
    product: { findUnique: jest.fn().mockResolvedValue(product) },
    cart: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    cartItem: { create: jest.fn().mockResolvedValue({ id: "item-1" }) },
  };
  return prisma as unknown as PrismaService;
}

const mtlProduct = {
  id: "mtl-1",
  fulfilmentType: FulfilmentType.MADE_TO_LENGTH,
};

const stockProduct = {
  id: "stock-1",
  fulfilmentType: FulfilmentType.STOCK,
};

const fabricatedProduct = {
  id: "fab-1",
  fulfilmentType: FulfilmentType.FABRICATED_TO_ORDER,
};

describe("CartService — Made-to-Length validation", () => {
  let service: CartService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = mockPrisma(mtlProduct);
    const module = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: prisma },
        { provide: PricingService, useValue: {} as unknown as PricingService },
      ],
    }).compile();
    service = module.get(CartService);
  });

  it("rejects MTL item without mtl config", async () => {
    (prisma as any).product.findUnique.mockResolvedValue(mtlProduct);
    await expect(
      service.addItem("cart-1", { productId: "mtl-1", quantity: 1 } as any)
    ).rejects.toThrow(BadRequestException);
  });

  it("accepts MTL item with valid config", async () => {
    (prisma as any).product.findUnique.mockResolvedValue(mtlProduct);
    const result = await service.addItem("cart-1", {
      productId: "mtl-1",
      quantity: 1,
      mtl: { gaugeMm: 0.5, profile: "CORR", colour: "CHARCOAL", lengthMm: 3000 },
    } as any);
    expect(result).toEqual({ id: "item-1" });
  });

  it("rejects MTL length exceeding 13,200mm max", async () => {
    (prisma as any).product.findUnique.mockResolvedValue(mtlProduct);
    await expect(
      service.addItem("cart-1", {
        productId: "mtl-1",
        quantity: 1,
        mtl: { gaugeMm: 0.5, profile: "CORR", colour: "CHARCOAL", lengthMm: 15000 },
      } as any)
    ).rejects.toThrow(BadRequestException);
  });

  it("accepts MTL length at exactly 13,200mm (boundary)", async () => {
    (prisma as any).product.findUnique.mockResolvedValue(mtlProduct);
    const result = await service.addItem("cart-1", {
      productId: "mtl-1",
      quantity: 1,
      mtl: { gaugeMm: 0.5, profile: "CORR", colour: "CHARCOAL", lengthMm: 13200 },
    } as any);
    expect(result).toEqual({ id: "item-1" });
  });

  it("accepts STOCK product without mtl config", async () => {
    (prisma as any).product.findUnique.mockResolvedValue(stockProduct);
    const result = await service.addItem("cart-1", {
      productId: "stock-1",
      quantity: 2,
    } as any);
    expect(result).toEqual({ id: "item-1" });
  });

  it("accepts FABRICATED_TO_ORDER without cutBendShapeCode (not a hard requirement)", async () => {
    (prisma as any).product.findUnique.mockResolvedValue(fabricatedProduct);
    const result = await service.addItem("cart-1", {
      productId: "fab-1",
      quantity: 1,
    } as any);
    expect(result).toEqual({ id: "item-1" });
  });

  it("throws NotFound for missing product", async () => {
    (prisma as any).product.findUnique.mockResolvedValue(null);
    await expect(
      service.addItem("cart-1", { productId: "missing", quantity: 1 } as any)
    ).rejects.toThrow(NotFoundException);
  });
});
