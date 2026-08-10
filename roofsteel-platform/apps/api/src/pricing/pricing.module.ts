import { Module } from "@nestjs/common";
import { Controller, Get, Param, Query } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { PricingService } from "./pricing.service";
import { AccountType } from "@prisma/client";

@Controller("pricing")
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  // GET /v1/pricing/:productId?tier=TRADE
  // Tier defaults to RETAIL. Real auth will replace the query-param tier
  // override with the caller's actual account type — left as a query param
  // here so the pricing logic can be exercised and tested independently of
  // the auth module while that's being built out.
  @Get(":productId")
  async getPrice(@Param("productId") productId: string, @Query("tier") tier?: AccountType) {
    return this.pricing.resolveProductPrice(productId, tier ?? AccountType.RETAIL);
  }
}

@Module({
  controllers: [PricingController],
  providers: [PricingService, PrismaService],
  exports: [PricingService],
})
export class PricingModule {}
