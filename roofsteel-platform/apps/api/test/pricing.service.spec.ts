// PricingService unit tests — verifies the three-formula pricing model against the
// Pricing Framework workbook (retail = cost*(1+markup), trade = retail*(1-discount),
// volume = retail*(1-discount)) and the tier-selection logic.
//
// We test the pure formula functions directly via the service's public resolveProductPrice,
// mocking PrismaService to return controlled product + pricing-band data. This tests the real
// calculation code path, not a mock of it.

import { Test } from "@nestjs/testing";
import { AccountType } from "@prisma/client";
import { PricingService } from "../src/pricing/pricing.service";
import { PrismaService } from "../src/common/prisma.service";

// A minimal mock PrismaService — only product.findUnique is used by resolveProductPrice.
function mockPrisma(product: any) {
  const prisma = {
    product: {
      findUnique: jest.fn().mockResolvedValue(product),
      findMany: jest.fn(),
    },
  };
  // PrismaService is a class; bind the mock properties onto an instance-like object.
  return prisma as unknown as PrismaService;
}

// A representative pricing band — matches the workbook's "Standard" band:
// 40% retail markup, 18% trade discount, 28% volume discount.
const standardBand = {
  id: "band-1",
  pricingKey: "STANDARD",
  retailMarkup: 0.40,
  tradeDiscount: 0.18,
  volumeDiscount: 0.28,
};

function makeProduct(cost: number) {
  return {
    id: "prod-1",
    sku: "TEST-SKU",
    landedCost: cost,
    costIsReal: true,
    pricingBand: standardBand,
  };
}

describe("PricingService", () => {
  let service: PricingService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = mockPrisma(makeProduct(100));
    const module = await Test.createTestingModule({
      providers: [PricingService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(PricingService);
  });

  it("computes retail price = landedCost * (1 + retailMarkup)", async () => {
    // 100 * 1.40 = 140.00
    const result = await service.resolveProductPrice("prod-1", AccountType.RETAIL);
    expect(result.retailPrice).toBe(140);
    expect(result.applicablePrice).toBe(140);
  });

  it("computes trade price = retail * (1 - tradeDiscount)", async () => {
    // retail 140, trade = 140 * 0.82 = 114.80
    const result = await service.resolveProductPrice("prod-1", AccountType.TRADE);
    expect(result.tradePrice).toBe(114.8);
    expect(result.applicablePrice).toBe(114.8);
  });

  it("computes volume price = retail * (1 - volumeDiscount)", async () => {
    // retail 140, volume = 140 * 0.72 = 100.80
    const result = await service.resolveProductPrice("prod-1", AccountType.CONTRACTOR);
    expect(result.volumePrice).toBe(100.8);
    expect(result.applicablePrice).toBe(100.8);
  });

  it("project tier falls back to volume price", async () => {
    const result = await service.resolveProductPrice("prod-1", AccountType.PROJECT);
    expect(result.applicablePrice).toBe(result.volumePrice);
  });

  it("rounds to 2 decimal places", async () => {
    // 33.33 * 1.40 = 46.662 → rounds to 46.66
    (prisma as any).product.findUnique.mockResolvedValue(makeProduct(33.33));
    const result = await service.resolveProductPrice("prod-1", AccountType.RETAIL);
    expect(result.retailPrice).toBe(46.66);
  });

  it("throws NotFound for a missing product", async () => {
    (prisma as any).product.findUnique.mockResolvedValue(null);
    await expect(service.resolveProductPrice("missing")).rejects.toThrow("not found");
  });

  it("reports costIsReal from the product", async () => {
    const result = await service.resolveProductPrice("prod-1", AccountType.RETAIL);
    expect(result.costIsReal).toBe(true);
  });
});
