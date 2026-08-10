import { Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../common/prisma.service";
import { CreateWishlistDto, AddWishlistItemDto } from "./dto/wishlists.dto";

// Multi-list, project-based wishlists — spec Section 3.7. A wishlist has a name
// ("Warehouse Roof Project", "Q3 Site Order"), an isPublic flag, and a shareSlug for
// sharing a public wishlist without exposing the account ID.
@Injectable()
export class WishlistsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByAccount(accountId: string) {
    return this.prisma.wishlist.findMany({
      where: { accountId },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(accountId: string, dto: CreateWishlistDto) {
    return this.prisma.wishlist.create({
      data: {
        accountId,
        name: dto.name,
        isPublic: dto.isPublic ?? false,
        shareSlug: dto.isPublic ? this.generateShareSlug() : null,
      },
      include: { items: true },
    });
  }

  async findById(wishlistId: string, accountId?: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
      include: { items: { include: { product: true } } },
    });
    if (!wishlist) throw new NotFoundException(`Wishlist ${wishlistId} not found`);
    if (accountId && wishlist.accountId !== accountId && !wishlist.isPublic) {
      throw new NotFoundException(`Wishlist ${wishlistId} not found`);
    }
    return wishlist;
  }

  async findByShareSlug(shareSlug: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { shareSlug },
      include: { items: { include: { product: true } } },
    });
    if (!wishlist || !wishlist.isPublic) {
      throw new NotFoundException(`Wishlist not found`);
    }
    return wishlist;
  }

  async addItem(wishlistId: string, accountId: string, dto: AddWishlistItemDto) {
    const wishlist = await this.findOwned(wishlistId, accountId);
    return this.prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: dto.productId,
      },
    });
  }

  async removeItem(wishlistId: string, itemId: string, accountId: string) {
    const wishlist = await this.findOwned(wishlistId, accountId);
    const item = await this.prisma.wishlistItem.findUnique({ where: { id: itemId } });
    if (!item || item.wishlistId !== wishlist.id) {
      throw new NotFoundException(`Wishlist item ${itemId} not found`);
    }
    await this.prisma.wishlistItem.delete({ where: { id: itemId } });
    return { removed: true };
  }

  async delete(wishlistId: string, accountId: string) {
    await this.findOwned(wishlistId, accountId);
    await this.prisma.wishlist.delete({ where: { id: wishlistId } });
    return { removed: true };
  }

  async updateVisibility(wishlistId: string, accountId: string, isPublic: boolean) {
    const wishlist = await this.findOwned(wishlistId, accountId);
    return this.prisma.wishlist.update({
      where: { id: wishlist.id },
      data: {
        isPublic,
        shareSlug: isPublic ? wishlist.shareSlug ?? this.generateShareSlug() : null,
      },
    });
  }

  private async findOwned(wishlistId: string, accountId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id: wishlistId } });
    if (!wishlist || wishlist.accountId !== accountId) {
      throw new NotFoundException(`Wishlist ${wishlistId} not found`);
    }
    return wishlist;
  }

  private generateShareSlug(): string {
    return randomBytes(8).toString("base64url");
  }
}
