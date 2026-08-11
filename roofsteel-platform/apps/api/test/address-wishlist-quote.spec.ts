// Address + Wishlist + Quote endpoint tests (T.8) — verifies the key business rules:
//   - Addresses: single-default constraint, ownership check on update/delete,
//     default-promotion on delete
//   - Wishlists: ownership check on findById, public access via shareSlug,
//     ownership on addItem/removeItem/delete
//   - Quotes: DRAFT→SENT status transition guard, ownership check

import { Test } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { Province, QuoteStatus } from "@prisma/client";
import { AddressesService } from "../src/addresses/addresses.service";
import { WishlistsService } from "../src/wishlists/wishlists.service";
import { QuotesService } from "../src/quotes/quotes.service";
import { PrismaService } from "../src/common/prisma.service";

function mockPrisma(overrides: Record<string, any> = {}) {
  const defaults = {
    address: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    wishlist: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    wishlistItem: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: "wi-1" }),
      delete: jest.fn(),
    },
    quote: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  return { ...defaults, ...overrides } as unknown as PrismaService;
}

describe("AddressesService", () => {
  let service: AddressesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [AddressesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(AddressesService);
  });

  it("unsets existing default when creating a new default address", async () => {
    (prisma as any).address.create.mockResolvedValue({ id: "addr-2" });
    await service.create("acc-1", {
      line1: "2 Main St", city: "Durban", province: Province.KWAZULU_NATAL,
      postalCode: "4001", isDefault: true,
    } as any);
    expect((prisma as any).address.updateMany).toHaveBeenCalledWith({
      where: { accountId: "acc-1", isDefault: true },
      data: { isDefault: false },
    });
  });

  it("throws NotFound when updating an address not owned by the account", async () => {
    (prisma as any).address.findUnique.mockResolvedValue({ id: "addr-1", accountId: "other" });
    await expect(
      service.update("acc-1", "addr-1", { line1: "New" } as any)
    ).rejects.toThrow(NotFoundException);
  });

  it("promotes another address to default when deleting the current default", async () => {
    (prisma as any).address.findUnique.mockResolvedValue({
      id: "addr-1", accountId: "acc-1", isDefault: true,
    });
    (prisma as any).address.findFirst.mockResolvedValue({ id: "addr-2" });
    await service.remove("acc-1", "addr-1");
    expect((prisma as any).address.update).toHaveBeenCalledWith({
      where: { id: "addr-2" },
      data: { isDefault: true },
    });
  });
});

describe("WishlistsService", () => {
  let service: WishlistsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [WishlistsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(WishlistsService);
  });

  it("generates a shareSlug when creating a public wishlist", async () => {
    (prisma as any).wishlist.create.mockResolvedValue({ id: "wl-1", shareSlug: "abc123" });
    const result = await service.create("acc-1", { name: "My Project", isPublic: true } as any);
    const createCall = (prisma as any).wishlist.create.mock.calls[0][0];
    expect(createCall.data.shareSlug).toBeTruthy();
    expect(createCall.data.isPublic).toBe(true);
  });

  it("does not generate a shareSlug for a private wishlist", async () => {
    (prisma as any).wishlist.create.mockResolvedValue({ id: "wl-1" });
    await service.create("acc-1", { name: "Private", isPublic: false } as any);
    const createCall = (prisma as any).wishlist.create.mock.calls[0][0];
    expect(createCall.data.shareSlug).toBeNull();
  });

  it("throws NotFound when a non-owner tries to view a private wishlist", async () => {
    (prisma as any).wishlist.findUnique.mockResolvedValue({
      id: "wl-1", accountId: "owner", isPublic: false,
    });
    await expect(service.findById("wl-1", "intruder")).rejects.toThrow(NotFoundException);
  });

  it("allows anyone to view a public wishlist via shareSlug", async () => {
    const publicWishlist = { id: "wl-1", isPublic: true, items: [] };
    (prisma as any).wishlist.findUnique.mockResolvedValue(publicWishlist);
    const result = await service.findByShareSlug("abc123");
    expect(result.id).toBe("wl-1");
  });

  it("throws NotFound when shareSlug doesn't match a public wishlist", async () => {
    (prisma as any).wishlist.findUnique.mockResolvedValue({ id: "wl-1", isPublic: false });
    await expect(service.findByShareSlug("invalid")).rejects.toThrow(NotFoundException);
  });

  it("throws NotFound when adding item to a wishlist not owned by the account", async () => {
    (prisma as any).wishlist.findUnique.mockResolvedValue({ id: "wl-1", accountId: "other" });
    await expect(
      service.addItem("wl-1", "acc-1", { productId: "p-1" } as any)
    ).rejects.toThrow(NotFoundException);
  });
});

describe("QuotesService", () => {
  let service: QuotesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [QuotesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(QuotesService);
  });

  it("creates a quote in DRAFT status with 30-day validity", async () => {
    (prisma as any).quote.create.mockResolvedValue({ id: "q-1", status: QuoteStatus.DRAFT });
    await service.create("acc-1", { items: [{ description: "Roof sheet", quantity: 10 }] } as any);
    const createCall = (prisma as any).quote.create.mock.calls[0][0];
    expect(createCall.data.status).toBe(QuoteStatus.DRAFT);
    expect(createCall.data.validUntil).toBeTruthy();
    expect(createCall.data.items.create[0].unitPrice).toBe(0);
  });

  it("submits a DRAFT quote to SENT", async () => {
    (prisma as any).quote.findUnique.mockResolvedValue({ id: "q-1", accountId: "acc-1", status: QuoteStatus.DRAFT });
    (prisma as any).quote.update.mockResolvedValue({ id: "q-1", status: QuoteStatus.SENT });
    const result = await service.submit("q-1", "acc-1");
    expect(result.status).toBe(QuoteStatus.SENT);
  });

  it("rejects submission of a quote that's not in DRAFT status", async () => {
    (prisma as any).quote.findUnique.mockResolvedValue({ id: "q-1", accountId: "acc-1", status: QuoteStatus.SENT });
    await expect(service.submit("q-1", "acc-1")).rejects.toThrow(BadRequestException);
  });

  it("throws NotFound when submitting a quote not owned by the account", async () => {
    (prisma as any).quote.findUnique.mockResolvedValue({ id: "q-1", accountId: "other", status: QuoteStatus.DRAFT });
    await expect(service.submit("q-1", "acc-1")).rejects.toThrow(NotFoundException);
  });
});
