import { Module, Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/reviews.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentAccount } from "../auth/current-account.decorator";
import type { JwtPayload } from "../auth/auth.service";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  // Public — list reviews for a product. No auth needed.
  @Get("products/:sku")
  list(@Param("sku") sku: string, @Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.reviews.listByProduct(
      sku,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10
    );
  }

  // Authenticated — create or update a review (one per product per account).
  @Post("products/:sku")
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentAccount() account: JwtPayload,
    @Param("sku") sku: string,
    @Body() dto: CreateReviewDto
  ) {
    return this.reviews.create(account.sub, sku, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@CurrentAccount() account: JwtPayload, @Param("id") id: string) {
    return this.reviews.remove(account.sub, id);
  }
}

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, PrismaService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
