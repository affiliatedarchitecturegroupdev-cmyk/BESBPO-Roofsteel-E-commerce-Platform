import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { AccountType } from "@prisma/client";

export interface ResolvedPrice {
  landedCost: number;
  retailPrice: number;
  tradePrice: number;
  volumePrice: number;
  /** The price actually charged, selected by the account's tier. */
  applicablePrice: number;
  pricingKey: string;
  costIsReal: boolean;
}

// Implements exactly the same three formulas as the Sample Priced Catalogue
// sheet in Roofsteel-Pricing-Framework.xlsx:
//   retail = landedCost * (1 + retailMarkup)
//   trade  = retail * (1 - tradeDiscount)
//   volume = retail * (1 - volumeDiscount)
// The workbook is the source of truth for the percentages themselves
// (Category Markup Bands sheet) — this service does not hardcode any
// category's numbers, it reads them from PricingBand at query time so an
// admin edit to the band propagates immediately, matching the workbook's
// own "edit the yellow cells, everything recalculates" design.
@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveProductPrice(productId: string, accountType: AccountType = AccountType.RETAIL): Promise<ResolvedPrice> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { pricingBand: true },
    });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    const cost = Number(product.landedCost);
    const band = product.pricingBand;

    const retailPrice = round2(cost * (1 + Number(band.retailMarkup)));
    const tradePrice = round2(retailPrice * (1 - Number(band.tradeDiscount)));
    const volumePrice = round2(retailPrice * (1 - Number(band.volumeDiscount)));

    const applicablePrice = selectTierPrice(accountType, { retailPrice, tradePrice, volumePrice });

    return {
      landedCost: cost,
      retailPrice,
      tradePrice,
      volumePrice,
      applicablePrice,
      pricingKey: band.pricingKey,
      costIsReal: product.costIsReal,
    };
  }

  async resolveManyProductPrices(productIds: string[], accountType: AccountType = AccountType.RETAIL) {
    return Promise.all(productIds.map((id) => this.resolveProductPrice(id, accountType)));
  }
}

// Retail tier pays full price. Trade and Contractor/Volume both resolve off
// the volume/trade bands per the tier definitions in the Pricing Framework's
// Customer Tiers sheet. Project/Tender is deliberately NOT resolved here —
// per spec Section 4.3, that tier is bespoke/negotiated via the Quote/RFQ
// engine, not an automatic formula.
function selectTierPrice(
  accountType: AccountType,
  prices: { retailPrice: number; tradePrice: number; volumePrice: number }
): number {
  switch (accountType) {
    case AccountType.TRADE:
      return prices.tradePrice;
    case AccountType.CONTRACTOR:
      return prices.volumePrice;
    case AccountType.PROJECT:
      // Falls back to volume pricing as a floor; real Project/Tender pricing
      // is issued through a Quote (see quotes module), not computed here.
      return prices.volumePrice;
    case AccountType.RETAIL:
    default:
      return prices.retailPrice;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
