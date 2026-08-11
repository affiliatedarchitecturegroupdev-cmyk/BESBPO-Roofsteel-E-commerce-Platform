import { Module, Controller, Get, Post, Param, Body, Query, UseGuards, Req } from "@nestjs/common";
import type { Request } from "express";
import { SkipThrottle } from "@nestjs/throttler";
import { PrismaService } from "../common/prisma.service";
import { PricingService } from "../pricing/pricing.service";
import { CartService } from "../cart/cart.service";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/orders.dto";
import { PayFastStrategy } from "./payments/payfast.strategy";
import { LulapayStrategy } from "./payments/lulapay.strategy";
import { PayJustNowStrategy } from "./payments/payjustnow.strategy";
import { PaymentProcessor } from "./payments/payment.processor";
import { InventoryModule } from "../inventory/inventory.module";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentAccount } from "../auth/current-account.decorator";
import type { JwtPayload } from "../auth/auth.service";
import { AccountType, OrderStatus } from "@prisma/client";

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly payFast: PayFastStrategy,
    private readonly lulapay: LulapayStrategy,
    private readonly payJustNow: PayJustNowStrategy,
    private readonly paymentProcessor: PaymentProcessor,
  ) {}

  // Optional auth: a guest can checkout with guestEmail; an authenticated user's account type
  // determines their pricing tier and available payment gateways. The real accountType is
  // threaded through here (guidelines/01-api-design.md, "Auth context in services").
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() dto: CreateOrderDto, @CurrentAccount() account?: JwtPayload) {
    const accountType = account?.type ?? AccountType.RETAIL;
    if (account && !dto.accountId) {
      dto.accountId = account.sub;
    }
    return this.orders.createOrder(dto, accountType);
  }

  // List orders for the authenticated account — paginated. This is a literal segment before
  // the :orderNumber parameterised route below to avoid the route conflict (guidelines/01
  // -api-design.md: "literal segments before parameterised ones").
  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentAccount() account: JwtPayload, @Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.orders.listByAccount(
      account.sub,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20
    );
  }

  @Get(":orderNumber")
  findOne(@Param("orderNumber") orderNumber: string) {
    return this.orders.getByOrderNumber(orderNumber);
  }

  // Webhook endpoints — one per gateway, since each has a different payload shape and
  // verification method (guidelines/05-payments.md). Each verifies the payload signature via
  // the gateway's strategy, then transitions the order to PAID. Idempotency: a retried webhook
  // for an already-PAID order is a no-op (the where clause won't match PENDING_PAYMENT).
  // Webhooks are exempt from rate limiting — they're called by the payment gateway, not users,
  // and the real protection is signature verification (guidelines/11-security-and-compliance.md).
  @Post("webhooks/payfast")
  @SkipThrottle()
  async payfastWebhook(@Body() payload: Record<string, string>, @Req() req: Request) {
    const headers = req.headers as Record<string, string>;
    const verified = await this.payFast.verify(payload, headers);
    if (!verified) return { received: false, reason: "signature_invalid" };

    // PayFast ITN payload includes m_payment_id (our orderNumber) and payment_status.
    if (payload.payment_status !== "COMPLETE") {
      return { received: true, status: payload.payment_status };
    }
    await this.paymentProcessor.confirmPayment(payload.m_payment_id, payload.pf_payment_id);
    return { received: true };
  }

  @Post("webhooks/lulapay")
  @SkipThrottle()
  async lulapayWebhook(@Body() payload: unknown, @Req() req: Request) {
    const headers = req.headers as Record<string, string>;
    const verified = await this.lulapay.verify(payload, headers);
    if (!verified) return { received: false, reason: "signature_invalid" };

    const body = payload as { orderNumber?: string; status?: string; reference?: string };
    if (body.status !== "SETTLED") {
      return { received: true, status: body.status };
    }
    if (body.orderNumber) {
      await this.paymentProcessor.confirmPayment(body.orderNumber, body.reference);
    }
    return { received: true };
  }

  @Post("webhooks/payjustnow")
  @SkipThrottle()
  async payJustNowWebhook(@Body() payload: unknown, @Req() req: Request) {
    const headers = req.headers as Record<string, string>;
    const verified = await this.payJustNow.verify(payload, headers);
    if (!verified) return { received: false, reason: "signature_invalid" };

    const body = payload as { orderNumber?: string; status?: string; reference?: string };
    if (body.status !== "APPROVED") {
      return { received: true, status: body.status };
    }
    if (body.orderNumber) {
      await this.paymentProcessor.confirmPayment(body.orderNumber, body.reference);
    }
    return { received: true };
  }
}

@Module({
  imports: [InventoryModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    PrismaService,
    PricingService,
    CartService,
    PayFastStrategy,
    LulapayStrategy,
    PayJustNowStrategy,
    PaymentProcessor,
  ],
})
export class OrdersModule {}
