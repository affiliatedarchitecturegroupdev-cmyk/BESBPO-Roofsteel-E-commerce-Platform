import { Module, Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { WishlistsService } from "./wishlists.service";
import { CreateWishlistDto, AddWishlistItemDto } from "./dto/wishlists.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentAccount } from "../auth/current-account.decorator";
import type { JwtPayload } from "../auth/auth.service";

@Controller("wishlists")
export class WishlistsController {
  constructor(private readonly wishlists: WishlistsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentAccount() account: JwtPayload) {
    return this.wishlists.listByAccount(account.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentAccount() account: JwtPayload, @Body() dto: CreateWishlistDto) {
    return this.wishlists.create(account.sub, dto);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentAccount() account: JwtPayload, @Param("id") id: string) {
    return this.wishlists.findById(id, account.sub);
  }

  // Public wishlist — accessible without auth via the shareSlug. No guard.
  @Get("shared/:slug")
  findByShareSlug(@Param("slug") slug: string) {
    return this.wishlists.findByShareSlug(slug);
  }

  @Post(":id/items")
  @UseGuards(JwtAuthGuard)
  addItem(
    @CurrentAccount() account: JwtPayload,
    @Param("id") id: string,
    @Body() dto: AddWishlistItemDto
  ) {
    return this.wishlists.addItem(id, account.sub, dto);
  }

  @Delete(":id/items/:itemId")
  @UseGuards(JwtAuthGuard)
  removeItem(
    @CurrentAccount() account: JwtPayload,
    @Param("id") id: string,
    @Param("itemId") itemId: string
  ) {
    return this.wishlists.removeItem(id, itemId, account.sub);
  }

  @Put(":id/visibility")
  @UseGuards(JwtAuthGuard)
  updateVisibility(
    @CurrentAccount() account: JwtPayload,
    @Param("id") id: string,
    @Body() body: { isPublic: boolean }
  ) {
    return this.wishlists.updateVisibility(id, account.sub, body.isPublic);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  delete(@CurrentAccount() account: JwtPayload, @Param("id") id: string) {
    return this.wishlists.delete(id, account.sub);
  }
}

@Module({
  controllers: [WishlistsController],
  providers: [WishlistsService, PrismaService],
  exports: [WishlistsService],
})
export class WishlistsModule {}
