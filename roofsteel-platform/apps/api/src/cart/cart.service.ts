import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { PricingService } from "../pricing/pricing.service";
import { AddCartItemDto, UpdateCartItemDto } from "./dto/cart.dto";
import { AccountType, FulfilmentType } from "@prisma/client";

// See guidelines/04-made-to-length-configurator.md — server-side validation is mandatory
// here even though the frontend also validates; never trust client-side validation alone
// for a field that feeds both pricing and a real manufacturing process.
const MAX_MTL_LENGTH_MM = 13200;

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService
  ) {}

  async getOrCreateCart(accountId?: string, guestId?: string) {
    if (accountId) {
      const existing = await this.prisma.cart.findFirst({ where: { accountId } });
      if (existing) return existing;
      return this.prisma.cart.create({ data: { accountId } });
    }
    if (guestId) {
      const existing = await this.prisma.cart.findUnique({ where: { guestId } });
      if (existing) return existing;
      return this.prisma.cart.create({ data: { guestId } });
    }
    throw new BadRequestException("Either accountId or guestId is required");
  }

  async addItem(cartId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException(`Product ${dto.productId} not found`);

    this.validateFulfilmentInputs(product.fulfilmentType, dto);

    return this.prisma.cartItem.create({
      data: {
        cartId,
        productId: dto.productId,
        quantity: dto.quantity,
        mtlGaugeMm: dto.mtl?.gaugeMm,
        mtlProfile: dto.mtl?.profile,
        mtlColour: dto.mtl?.colour,
        mtlLengthMm: dto.mtl?.lengthMm,
        cutBendShapeCode: dto.cutBendShapeCode,
      },
    });
  }

  async updateItemQuantity(itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`Cart item ${itemId} not found`);
    return this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
  }

  async removeItem(itemId: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`Cart item ${itemId} not found`);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return { removed: true };
  }

  // Cart totals resolve through PricingService, never a cached/stored price — this is the
  // same "single source of truth, computed at read time" rule as product listing. See
  // guidelines/06-pricing-engine.md.
  async getCartWithPricing(cartId: string, accountType: AccountType = AccountType.RETAIL) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true } } },
    });
    if (!cart) throw new NotFoundException(`Cart ${cartId} not found`);

    const linesWithPricing = await Promise.all(
      cart.items.map(async (item) => {
        const pricing = await this.pricing.resolveProductPrice(item.productId, accountType);
        const lineArea = item.mtlLengthMm ? item.mtlLengthMm / 1000 : 1; // per-metre lines scale by length; per-unit lines don't
        const lineTotal = round2(pricing.applicablePrice * lineArea * item.quantity);
        // Same length-scaling as lineTotal above — a 6.2m Made-to-Length line
        // weighs 6.2x the product's per-metre weightKgPerUnit, not a flat
        // per-unit weight. Feeds real freight calculation in
        // OrdersService.calculateFreight — see
        // guidelines/15-delivery-courier-and-location.md Section 2.
        const lineWeightKg = round2(Number(item.product.weightKgPerUnit) * lineArea * item.quantity);
        return { ...item, pricing, lineTotal, lineWeightKg };
      })
    );

    const subtotal = round2(linesWithPricing.reduce((sum, l) => sum + l.lineTotal, 0));
    const totalWeightKg = round2(linesWithPricing.reduce((sum, l) => sum + l.lineWeightKg, 0));

    return { ...cart, items: linesWithPricing, subtotal, totalWeightKg };
  }

  // Guest-to-account merge on login — required by spec Section 3.6. Existing account cart
  // items are kept; guest items are appended, not overwritten, so a customer who added items
  // as a guest and then logs in doesn't lose them.
  async mergeGuestCartIntoAccount(guestId: string, accountId: string) {
    const guestCart = await this.prisma.cart.findUnique({ where: { guestId }, include: { items: true } });
    if (!guestCart || guestCart.items.length === 0) return this.getOrCreateCart(accountId);

    const accountCart = await this.getOrCreateCart(accountId);
    await this.prisma.cartItem.updateMany({
      where: { cartId: guestCart.id },
      data: { cartId: accountCart.id },
    });
    await this.prisma.cart.delete({ where: { id: guestCart.id } });
    return this.prisma.cart.findUnique({ where: { id: accountCart.id }, include: { items: true } });
  }

  private validateFulfilmentInputs(fulfilmentType: FulfilmentType, dto: AddCartItemDto) {
    if (fulfilmentType === FulfilmentType.MADE_TO_LENGTH) {
      if (!dto.mtl) {
        throw new BadRequestException("This product requires Made to Length configuration (gauge, profile, colour, length)");
      }
      if (dto.mtl.lengthMm > MAX_MTL_LENGTH_MM) {
        throw new BadRequestException(
          `Length ${dto.mtl.lengthMm}mm exceeds the ${MAX_MTL_LENGTH_MM}mm maximum for Made to Length sheet`
        );
      }
    }
    if (fulfilmentType === FulfilmentType.FABRICATED_TO_ORDER && !dto.cutBendShapeCode) {
      // Not all Fabricated to Order lines are cut/bend reinforcing steel (trusses and gates
      // are also this fulfilment type) — so this is intentionally not a hard requirement here,
      // just a note for Phase 2: route non-standard shapes to the Quote/RFQ engine instead of
      // the standard cart, per guidelines/04-made-to-length-configurator.md's cut/bend section.
    }
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
