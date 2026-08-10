import { Module, Controller, Get, Param, Query, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { PricingService } from "../pricing/pricing.service";
import { FulfilmentType, Segment, AccountType } from "@prisma/client";

// Query facets match spec Section 3.5's adaptation of the blueprint's faceted
// filtering: category, subcategory, fulfilment type, and segment — NOT
// "brand", which was dropped because Roofsteel is single-vendor.
export interface ProductQuery {
  category?: string;
  segment?: Segment;
  fulfilmentType?: FulfilmentType;
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService
  ) {}

  async list(query: ProductQuery, accountType: AccountType = AccountType.RETAIL) {
    const page = query.page ?? 1;
    // Capped at 100 — same deliberate ceiling used on every listing endpoint
    // across the group's prior e-commerce builds (Bellwether SWE Plumbers).
    const pageSize = Math.min(query.pageSize ?? 24, 100);

    const where: any = { active: true };
    if (query.category) where.category = { slug: query.category };
    if (query.fulfilmentType) where.fulfilmentType = query.fulfilmentType;
    if (query.segment) where.segments = { some: { segment: query.segment } };
    if (query.search) {
      // Placeholder equality/contains filter for the foundation stage.
      // Phase 2 (spec Section 6.3) replaces this with real Postgres
      // full-text search (tsvector/pg_trgm) per the Section 2.2 decision —
      // intentionally not implemented here so it isn't half-built twice.
      where.name = { contains: query.search, mode: "insensitive" };
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, subcategory: true, segments: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.product.count({ where }),
    ]);

    const priced = await this.pricing.resolveManyProductPrices(items.map((i) => i.id), accountType);
    const withPricing = items.map((item, i) => ({ ...item, pricing: priced[i] }));

    return { items: withPricing, total, page, pageSize };
  }

  async findBySku(sku: string, accountType: AccountType = AccountType.RETAIL) {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: { category: true, subcategory: true, segments: true, complianceDocs: true },
    });
    if (!product) throw new NotFoundException(`Product ${sku} not found`);
    const pricing = await this.pricing.resolveProductPrice(product.id, accountType);
    return { ...product, pricing };
  }
}

@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() query: ProductQuery) {
    // TODO(auth module): resolve accountType from the authenticated caller
    // instead of always pricing as RETAIL once auth is wired in (Phase 1/3).
    return this.products.list(query);
  }

  @Get(":sku")
  findOne(@Param("sku") sku: string) {
    return this.products.findBySku(sku);
  }
}

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService, PricingService],
})
export class ProductsModule {}
