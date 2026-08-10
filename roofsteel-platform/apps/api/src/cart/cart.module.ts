import { Module, Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { PricingService } from "../pricing/pricing.service";
import { CartService } from "./cart.service";
import { AddCartItemDto, UpdateCartItemDto } from "./dto/cart.dto";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentAccount } from "../auth/current-account.decorator";
import type { JwtPayload } from "../auth/auth.service";
import { AccountType } from "@prisma/client";

@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}

  // Optional auth: an authenticated user's cart is resolved from their accountId; a guest's
  // from their guestId query param. If both are present, accountId takes precedence (the guest
  // cart would have been merged on login).
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async get(
    @CurrentAccount() account?: JwtPayload,
    @Query("guestId") guestId?: string
  ) {
    const cart = await this.cart.getOrCreateCart(account?.sub, guestId);
    const accountType = account?.type ?? AccountType.RETAIL;
    return this.cart.getCartWithPricing(cart.id, accountType);
  }

  @Post("items")
  @UseGuards(OptionalJwtAuthGuard)
  async addItem(
    @Body() dto: AddCartItemDto,
    @CurrentAccount() account?: JwtPayload,
    @Query("guestId") guestId?: string
  ) {
    const cart = await this.cart.getOrCreateCart(account?.sub, guestId);
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

  // Merge a guest cart into the authenticated account's cart on login.
  @Post("merge")
  @UseGuards(JwtAuthGuard)
  mergeGuestCart(
    @CurrentAccount() account: JwtPayload,
    @Body("guestId") guestId: string
  ) {
    return this.cart.mergeGuestCartIntoAccount(guestId, account.sub);
  }
}

@Module({
  controllers: [CartController],
  providers: [CartService, PrismaService, PricingService],
})
export class CartModule {}
