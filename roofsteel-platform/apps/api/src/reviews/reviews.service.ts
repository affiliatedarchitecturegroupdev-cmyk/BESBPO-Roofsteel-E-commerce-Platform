import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { CreateReviewDto } from "./dto/reviews.dto";

// Text/star reviews at launch (spec Section 8 — photo upload is an open question, not in
// v1 scope). One review per product per account, enforced by the @@unique([accountId,
// productId]) constraint in schema.prisma — the upsert below relies on it.
@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByProduct(productSku: string, page = 1, pageSize = 10) {
    const product = await this.prisma.product.findUnique({ where: { sku: productSku } });
    if (!product) throw new NotFoundException(`Product ${productSku} not found`);

    const size = Math.min(pageSize, 100);
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId: product.id },
        include: { account: { select: { name: true } } },
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.review.count({ where: { productId: product.id } }),
    ]);

    const avgRating = total > 0
      ? await this.prisma.review.aggregate({
          where: { productId: product.id },
          _avg: { rating: true },
        })
      : null;

    return {
      items,
      total,
      page,
      pageSize: size,
      averageRating: avgRating?._avg.rating ?? null,
    };
  }

  async create(accountId: string, productSku: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { sku: productSku } });
    if (!product) throw new NotFoundException(`Product ${productSku} not found`);

    // upsert relies on the @@unique([accountId, productId]) constraint — if the customer
    // already reviewed this product, their existing review is updated, not duplicated.
    // This is more user-friendly than rejecting the second attempt outright.
    return this.prisma.review.upsert({
      where: { accountId_productId: { accountId, productId: product.id } },
      update: { rating: dto.rating, body: dto.body },
      create: {
        accountId,
        productId: product.id,
        rating: dto.rating,
        body: dto.body,
      },
    });
  }

  async remove(accountId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.accountId !== accountId) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }
    await this.prisma.review.delete({ where: { id: reviewId } });
    return { removed: true };
  }
}
