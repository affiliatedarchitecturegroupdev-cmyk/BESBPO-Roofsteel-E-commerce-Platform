import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { CartService } from "../cart/cart.service";
import { PayFastStrategy } from "./payments/payfast.strategy";
import { LulapayStrategy } from "./payments/lulapay.strategy";
import { PayJustNowStrategy } from "./payments/payjustnow.strategy";
import { PaymentStrategy, GATEWAYS_BY_TIER } from "./payments/payment-strategy.interface";
import { CreateOrderDto } from "./dto/orders.dto";
import { AccountType, OrderStatus, PaymentGateway, Province } from "@prisma/client";

// See guidelines/05-payments.md for the Strategy Pattern rationale, and
// guidelines/06-pricing-engine.md for why cart/order pricing is always resolved fresh, never
// trusted from client input.
@Injectable()
export class OrdersService {
  private readonly strategies: Record<PaymentStrategy["gatewayName"], PaymentStrategy>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
    payFast: PayFastStrategy,
    lulapay: LulapayStrategy,
    payJustNow: PayJustNowStrategy
  ) {
    this.strategies = { PAYFAST: payFast, LULAPAY: lulapay, PAYJUSTNOW: payJustNow };
  }

  async createOrder(dto: CreateOrderDto, accountType: AccountType = AccountType.RETAIL) {
    if (!dto.accountId && !dto.guestEmail) {
      throw new BadRequestException("Either accountId or guestEmail is required");
    }

    this.assertGatewayAllowedForTier(dto.gateway, accountType);

    const cart = await this.cart.getCartWithPricing(dto.cartId, accountType);
    if (cart.items.length === 0) {
      throw new BadRequestException("Cannot create an order from an empty cart");
    }

    const freightCost = this.calculateFreight(dto.province, cart.totalWeightKg, cart.subtotal);
    const total = round2(cart.subtotal + freightCost);
    const orderNumber = this.generateOrderNumber();
    const estimatedReadyDays = this.calculateEstimatedReadyDays(cart.items);

    // Order + line items created together — an order that exists with no items (or vice
    // versa) is exactly the inconsistent state a transaction here prevents. Prices are locked
    // in from the cart's already-resolved pricing at this moment (see guidelines/02-database.md
    // on why OrderItem.unitPrice is the one place a price gets persisted, not recomputed later).
    // fulfilmentType is snapshotted the same way, for the same reason — see the schema comment
    // on OrderItem.fulfilmentType and guidelines/14-checkout-and-fulfilment-timing.md.
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        accountId: dto.accountId,
        guestEmail: dto.guestEmail,
        status: OrderStatus.PENDING_PAYMENT,
        priceTierApplied: accountType,
        province: dto.province,
        freightCost,
        estimatedReadyDays,
        subtotal: cart.subtotal,
        total,
        paymentGateway: dto.gateway as PaymentGateway,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.pricing.applicablePrice,
            fulfilmentType: item.product.fulfilmentType,
            mtlGaugeMm: item.mtlGaugeMm,
            mtlProfile: item.mtlProfile,
            mtlColour: item.mtlColour,
            mtlLengthMm: item.mtlLengthMm,
            cutBendShapeCode: item.cutBendShapeCode,
          })),
        },
      },
      include: { items: true },
    });

    const strategy = this.strategies[dto.gateway];
    const paymentSession = await strategy.initialize({
      id: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      guestEmail: order.guestEmail,
      accountId: order.accountId,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentRef: paymentSession.gatewayReference },
    });

    return { order, paymentSession };
  }

  async getByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException(`Order ${orderNumber} not found`);
    return order;
  }

  // List orders for an authenticated account — paginated, most recent first. This is what
  // the /account/orders page calls. Guest orders (no accountId) are excluded — a guest only
  // sees their order if they have the orderNumber from their confirmation email.
  async listByAccount(accountId: string, page = 1, pageSize = 20) {
    const size = Math.min(pageSize, 100);
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { accountId },
        include: { _count: { select: { items: true } } },
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.count({ where: { accountId } }),
    ]);
    return { items, total, page, pageSize: size };
  }

  private assertGatewayAllowedForTier(gateway: PaymentStrategy["gatewayName"], accountType: AccountType) {
    const allowed = GATEWAYS_BY_TIER[accountType];
    if (!allowed.includes(gateway)) {
      throw new ForbiddenException(
        `${gateway} is not available for ${accountType} tier accounts. Available: ${allowed.join(", ")}`
      );
    }
  }

  // Real weight- and province-distance-banded freight, replacing the flat
  // R450 placeholder (ADR-008) — see guidelines/15-delivery-courier-and-
  // location.md Section 2 for the full reasoning. The RAND VALUES here are
  // still illustrative (ADR-008's caveat still applies — no rate-card
  // review has happened), but the STRUCTURE is now real: weight from the
  // 80 products with genuine engineering mass data plus 91 reasoned
  // estimates (guidelines/13's weightIsReal flag), distance-banded from
  // the Phase 1 KZN flagship yard using real approximate road distances.
  private calculateFreight(province: Province, totalWeightKg: number, subtotal: number): number {
    const FREE_DELIVERY_THRESHOLD = 15000;
    // Free delivery only makes sense for a light order — waiving a real
    // heavy-freight truck run because the rand value crossed a threshold
    // would be giving away the actual cost of moving a tonne of steel.
    const FREE_DELIVERY_MAX_WEIGHT_KG = 50;
    if (subtotal >= FREE_DELIVERY_THRESHOLD && totalWeightKg <= FREE_DELIVERY_MAX_WEIGHT_KG) {
      return 0;
    }

    const weightBase = weightBandRate(totalWeightKg);
    const distanceMultiplier = PROVINCE_DISTANCE_MULTIPLIER[province] ?? 1.5;
    return round2(weightBase * distanceMultiplier);
  }

  // See guidelines/14-checkout-and-fulfilment-timing.md — MAX across lines, not an
  // average and not the fastest line. A single order containing one Stock item and one
  // Made-to-Length item is only genuinely "ready" once the slower line is, and telling the
  // customer the fast line's timing would be honestly wrong about the whole order.
  private calculateEstimatedReadyDays(items: Array<{ product: { fulfilmentType: string; leadTimeDays: number | null } }>): number {
    let max = 0;
    for (const item of items) {
      const days = item.product.fulfilmentType === "STOCK" ? 0 : item.product.leadTimeDays ?? 0;
      if (days > max) max = days;
    }
    return max;
  }

  private generateOrderNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `RS-${ts}-${rand}`;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Weight bands — illustrative rand values (ADR-008's caveat still applies,
// no rate-card review has happened), but real reasoning behind the
// breakpoints: 0-50kg is standard parcel-courier territory, 50-500kg is
// light freight (a bakkie/small truck run), 500-2000kg needs a proper
// flatbed, 2000kg+ is bulk structural steel needing a real freight truck —
// see guidelines/15-delivery-courier-and-location.md Section 2.
function weightBandRate(totalWeightKg: number): number {
  if (totalWeightKg <= 50) return 450;
  if (totalWeightKg <= 500) return 900;
  if (totalWeightKg <= 2000) return 2200;
  if (totalWeightKg <= 8000) return 4500;
  // Heavy bulk freight — per-tonne increment above the 8t base band rather
  // than a single flat rate, so a genuinely large structural steel order
  // doesn't get the same price as one just over the threshold.
  const extraTonnes = Math.ceil((totalWeightKg - 8000) / 1000);
  return 8500 + extraTonnes * 550;
}

// Real approximate road-distance reasoning from the Phase 1 KZN flagship
// yard (Durban area) — not precise routing, but grounded in actual
// distances, not arbitrary numbers. See
// guidelines/15-delivery-courier-and-location.md Section 2. Revisit once
// the Gauteng depot (capacity deck Phase 2) opens — freight should
// originate from whichever yard is closer to the delivery province, not
// always KZN.
const PROVINCE_DISTANCE_MULTIPLIER: Record<Province, number> = {
  KWAZULU_NATAL: 1.0, // local — the base rate
  GAUTENG: 1.3, // Durban-Johannesburg, ~570km, well-served freight corridor
  MPUMALANGA: 1.3, // similar distance range to Gauteng
  EASTERN_CAPE: 1.2, // Durban-East London, ~670km
  LIMPOPO: 1.5, // Durban-Polokwane, ~900km+
  NORTH_WEST: 1.6, // Durban-Mahikeng/Rustenburg, ~950km+
  WESTERN_CAPE: 1.9, // Durban-Cape Town, ~1,650km — the furthest of the 7 served provinces
};
