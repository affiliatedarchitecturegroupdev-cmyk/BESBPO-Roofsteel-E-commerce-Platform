import { Module, Controller, Get, Post, Param, Body } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { PricingService } from "../pricing/pricing.service";
import { CartService } from "../cart/cart.service";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/orders.dto";
import { PayFastStrategy } from "./payments/payfast.strategy";
import { LulapayStrategy } from "./payments/lulapay.strategy";
import { PayJustNowStrategy } from "./payments/payjustnow.strategy";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // TODO(Phase 2, auth): accountType resolved from the authenticated session, not defaulted
  // to RETAIL — same TODO as products.module.ts and cart.module.ts.
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orders.createOrder(dto);
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
