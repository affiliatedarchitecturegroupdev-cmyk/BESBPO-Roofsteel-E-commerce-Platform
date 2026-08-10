import { Module, Controller, Get, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

// Built per Gap Analysis I Section 8, priority #1 — the real Home page's
// CategoryGrid had nothing to fetch from before this existed. Deliberately
// simple: categories don't need pricing resolution or segment filtering,
// just name/slug/count, so this doesn't reuse ProductsService's heavier
// query pattern.
export interface CategoryWithCount {
  slug: string;
  name: string;
  lineCount: number;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listWithCounts(): Promise<CategoryWithCount[]> {
    const categories = await this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
    return categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      lineCount: c._count.products,
    }));
  }
}

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.listWithCounts();
  }
}

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService],
})
export class CategoriesModule {}
