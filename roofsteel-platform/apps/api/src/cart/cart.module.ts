import { Module, Controller, Get, Post, Patch, Delete, Param, Body, Query } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { PricingService } from "../pricing/pricing.service";
import { CartService } from "./cart.service";
import { AddCartItemDto, UpdateCartItemDto } from "./dto/cart.dto";

@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}

  // TODO(Phase 2, auth): resolve accountId from the authenticated session instead of a
  // query param once auth middleware exists — guestId query param remains for unauthenticated
  // browsing either way.
  @Get()
  async get(@Query("accountId") accountId?: string, @Query("guestId") guestId?: string) {
    const cart = await this.cart.getOrCreateCart(accountId, guestId);
    return this.cart.getCartWithPricing(cart.id);
  }

  @Post("items")
  async addItem(
    @Body() dto: AddCartItemDto,
    @Query("accountId") accountId?: string,
    @Query("guestId") guestId?: string
  ) {
    const cart = await this.cart.getOrCreateCart(accountId, guestId);
    return this.cart.addItem(cart.id, dto);
  }

  @Patch("items/:itemId")
  updateItem(@Param("itemId") itemId: string, @Body() dto: UpdateCartItemDto) {
    return this.cart.updateItemQuantity(itemId, dto);
  }

  @Delete("items/:itemId")
  removeItem(@Param("itemId") itemId: string) {
    return this.cart.removeItem(itemId);
  }

  @Post("merge")
  mergeGuestCart(@Body("guestId") guestId: string, @Body("accountId") accountId: string) {
    return this.cart.mergeGuestCartIntoAccount(guestId, accountId);
  }
}

@Module({
  controllers: [CartController],
  providers: [CartService, PrismaService, PricingService],
})
export class CartModule {}
