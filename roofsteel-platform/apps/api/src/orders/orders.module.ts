import { Module, Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { PricingService } from "../pricing/pricing.service";
import { CartService } from "../cart/cart.service";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/orders.dto";
import { PayFastStrategy } from "./payments/payfast.strategy";
import { LulapayStrategy } from "./payments/lulapay.strategy";
import { PayJustNowStrategy } from "./payments/payjustnow.strategy";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { CurrentAccount } from "../auth/current-account.decorator";
import type { JwtPayload } from "../auth/auth.service";
import { AccountType } from "@prisma/client";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

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
  // verification method (guidelines/05-payments.md). Real signature verification wiring is
  // Phase 3 scope; routes exist now so the URL contract is stable.
  @Post("webhooks/payfast")
  payfastWebhook(@Body() _payload: unknown) {
    // TODO(Phase 3): verify via PayFastStrategy.verify(), then transition order status.
    return { received: true };
  }

  @Post("webhooks/lulapay")
  lulapayWebhook(@Body() _payload: unknown) {
    // TODO(Phase 3): verify via LulapayStrategy.verify(), then transition order status.
    return { received: true };
  }

  @Post("webhooks/payjustnow")
  payJustNowWebhook(@Body() _payload: unknown) {
    // TODO(Phase 3): verify via PayJustNowStrategy.verify(), then transition order status.
    return { received: true };
  }
}

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    PrismaService,
    PricingService,
    CartService,
    PayFastStrategy,
    LulapayStrategy,
    PayJustNowStrategy,
  ],
})
export class OrdersModule {}
