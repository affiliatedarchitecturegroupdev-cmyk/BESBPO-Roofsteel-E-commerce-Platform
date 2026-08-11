import {
  Module, Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Injectable,
} from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { PrismaService } from "../common/prisma.service";
import { AdminGuard } from "../auth/admin.guard";
import { OrderStatus, Prisma } from "@prisma/client";
import { NotFoundException } from "@nestjs/common";
import { QUEUE_NAMES } from "../queue/queue.module";
import type { StockAlertJob } from "../queue/processors/stock-alert.processor";

// Admin module — all routes under /v1/admin/* require AdminGuard (role: ADMIN). Never reuse
// a customer-facing route with a hidden admin branch (guidelines/01-api-design.md). Each
// admin operation is a separate controller method, not a generic "update" endpoint.

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(status?: OrderStatus, page = 1, pageSize = 20) {
    const size = Math.min(pageSize, 100);
    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { account: { select: { name: true, email: true } }, items: true },
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page, pageSize: size };
  }

  async transitionOrder(orderId: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}

@Injectable()
export class AdminTradeAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPending() {
    return this.prisma.tradeAccountApplication.findMany({
      where: { status: "PENDING" },
      include: { account: { select: { name: true, email: true, companyName: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  // Approve — single transaction: set application to APPROVED and account.type to TRADE.
  // Never two separate updates (guidelines/01-api-design.md: atomic state transitions).
  async approve(applicationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const app = await tx.tradeAccountApplication.update({
        where: { id: applicationId },
        data: { status: "APPROVED", reviewedAt: new Date() },
      });
      await tx.account.update({
        where: { id: app.accountId },
        data: { type: "TRADE" },
      });
      return app;
    });
  }

  async reject(applicationId: string, rejectionReason: string) {
    return this.prisma.tradeAccountApplication.update({
      where: { id: applicationId },
      data: { status: "REJECTED", rejectionReason, reviewedAt: new Date() },
    });
  }
}

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(page = 1, pageSize = 20, search?: string) {
    const size = Math.min(pageSize, 100);
    const where: Prisma.ProductWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * size,
        take: size,
        orderBy: { name: "asc" },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, total, page, pageSize: size };
  }

  async updateProduct(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({ where: { id }, data });
  }
}

// Pricing bands editor — matches the Roofsteel-Pricing-Framework.xlsx "Category Markup Bands"
// sheet's "edit the yellow cells, everything recalculates" design (guidelines/06-pricing-engine.md).
// An admin edits the markup/discount percentages; all products in that band recompute their
// prices on the next PricingService.resolveProductPrice() call. The band's rationale field
// captures why a particular percentage was chosen — never let a pricing number exist without
// a documented reason.
@Injectable()
export class AdminPricingBandsService {
  constructor(private readonly prisma: PrismaService) {}

  async listBands() {
    const bands = await this.prisma.pricingBand.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { pricingKey: "asc" },
    });
    return bands.map((b) => ({
      ...b,
      retailMarkup: Number(b.retailMarkup),
      tradeDiscount: Number(b.tradeDiscount),
      volumeDiscount: Number(b.volumeDiscount),
    }));
  }

  async getBand(id: string) {
    const band = await this.prisma.pricingBand.findUnique({
      where: { id },
      include: { products: { select: { id: true, sku: true, name: true } } },
    });
    if (!band) return null;
    return {
      ...band,
      retailMarkup: Number(band.retailMarkup),
      tradeDiscount: Number(band.tradeDiscount),
      volumeDiscount: Number(band.volumeDiscount),
    };
  }

  // Update a band's markup/discount percentages. Validates that all three values are in
  // valid ranges: markup 0–5 (0%–500%), discounts 0–0.99 (0%–99%). A discount of 1.0 (100%)
  // would make the price zero — that's a data error, not a legitimate pricing decision.
  async updateBand(id: string, data: {
    retailMarkup?: number;
    tradeDiscount?: number;
    volumeDiscount?: number;
    rationale?: string;
  }) {
    if (data.retailMarkup !== undefined) {
      if (data.retailMarkup < 0 || data.retailMarkup > 5) {
        throw new Error("retailMarkup must be between 0 and 5 (0%–500%)");
      }
    }
    for (const field of ["tradeDiscount", "volumeDiscount"] as const) {
      if (data[field] !== undefined) {
        if (data[field] < 0 || data[field] >= 1) {
          throw new Error(`${field} must be between 0 and 0.99 (0%–99%)`);
        }
      }
    }
    return this.prisma.pricingBand.update({ where: { id }, data });
  }

  async createBand(data: {
    pricingKey: string;
    retailMarkup: number;
    tradeDiscount: number;
    volumeDiscount: number;
    rationale?: string;
  }) {
    return this.prisma.pricingBand.create({ data });
  }
}

// Stock levels/movements admin — view current stock across locations, adjust qtyOnHand
// (with a StockMovement audit trail), and view movement history. Every qtyOnHand change
// goes through a StockMovement record — never a bare update — so the audit trail is
// complete and tamper-evident (guidelines/13-listings-cms-inventory-sales.md Section 3.1).
@Injectable()
export class AdminStockService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.STOCK_ALERTS) private readonly stockAlertQueue: Queue<StockAlertJob>,
  ) {}

  private static readonly LOW_STOCK_THRESHOLD = 10;

  // List stock levels with product and location info, filterable by location.
  async listStock(locationId?: string, page = 1, pageSize = 50) {
    const size = Math.min(pageSize, 200);
    const where: Prisma.StockLevelWhereInput = locationId ? { locationId } : {};
    const [items, total] = await Promise.all([
      this.prisma.stockLevel.findMany({
        where,
        include: {
          product: { select: { id: true, sku: true, name: true, unit: true } },
          location: { select: { id: true, name: true } },
        },
        skip: (page - 1) * size,
        take: size,
        orderBy: { product: { name: "asc" } },
      }),
      this.prisma.stockLevel.count({ where }),
    ]);
    return {
      items: items.map((s) => ({
        ...s,
        available: s.qtyOnHand - s.qtyReserved,
      })),
      total,
      page,
      pageSize: size,
    };
  }

  // Adjust stock — creates a StockMovement and updates qtyOnHand atomically. The movement
  // type determines the sign: RECEIVED/TRANSFERRED_IN are positive, DAMAGED/TRANSFERRED_OUT
  // are negative. ADJUSTED is a delta (positive or negative) for stock-take corrections.
  async adjustStock(stockLevelId: string, data: {
    type: "RECEIVED" | "DAMAGED" | "ADJUSTED" | "TRANSFERRED_IN" | "TRANSFERRED_OUT";
    quantity: number;
    note?: string;
    reference?: string;
  }) {
    const sign = data.type === "DAMAGED" || data.type === "TRANSFERRED_OUT" ? -1 : 1;
    const delta = data.type === "ADJUSTED" ? data.quantity : sign * Math.abs(data.quantity);

    const result = await this.prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          stockLevelId,
          type: data.type,
          quantity: delta,
          note: data.note,
          reference: data.reference,
        },
      });
      const updated = await tx.stockLevel.update({
        where: { id: stockLevelId },
        data: { qtyOnHand: { increment: delta } },
        include: {
          product: { select: { sku: true, name: true } },
          location: { select: { name: true } },
        },
      });
      // Guard against negative stock — a damaged/transfer movement that would push qtyOnHand
      // below zero is a data error. Roll back the transaction.
      if (updated.qtyOnHand < 0) {
        throw new Error(
          `Stock adjustment would result in negative qtyOnHand (${updated.qtyOnHand}) for ` +
            `${updated.product.sku} at ${updated.location.name}`
        );
      }

      return { movement, stockLevel: updated };
    });

    // Enqueue stock alert jobs after the transaction commits — fire-and-forget, never block
    // the admin response. Two cases (guidelines/09-notifications-and-jobs.md):
    // 1. Stock was ≤0 before, now >0 → back_in_stock (notify wishlisted customers).
    // 2. Stock dropped to/below threshold → low_stock (notify restock managers).
    const prevQty = result.stockLevel.qtyOnHand - delta;
    const { sku, name } = result.stockLevel.product;

    if (delta > 0 && prevQty <= 0 && result.stockLevel.qtyOnHand > 0) {
      await this.stockAlertQueue.add("back_in_stock", {
        productId: result.stockLevel.productId,
        productSku: sku,
        productName: name,
        alertType: "back_in_stock",
        currentStock: result.stockLevel.qtyOnHand,
      });
    }
    if (delta < 0 && result.stockLevel.qtyOnHand <= AdminStockService.LOW_STOCK_THRESHOLD) {
      await this.stockAlertQueue.add("low_stock", {
        productId: result.stockLevel.productId,
        productSku: sku,
        productName: name,
        alertType: "low_stock",
        threshold: AdminStockService.LOW_STOCK_THRESHOLD,
        currentStock: result.stockLevel.qtyOnHand,
      });
    }

    return result;
  }

  // View movement history for a stock level — the full audit trail.
  async listMovements(stockLevelId: string, page = 1, pageSize = 50) {
    const size = Math.min(pageSize, 200);
    const [items, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where: { stockLevelId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.stockMovement.count({ where: { stockLevelId } }),
    ]);
    return { items, total, page, pageSize: size };
  }

  // Low-stock report — products where available stock is at or below a threshold.
  async lowStockReport(threshold = 10) {
    const levels = await this.prisma.stockLevel.findMany({
      where: { qtyOnHand: { lte: threshold } },
      include: {
        product: { select: { sku: true, name: true } },
        location: { select: { name: true } },
      },
      orderBy: { qtyOnHand: "asc" },
    });
    return levels.map((s) => ({
      ...s,
      available: s.qtyOnHand - s.qtyReserved,
      isLow: s.qtyOnHand - s.qtyReserved <= threshold,
    }));
  }
}

// Sales/revenue reporting — admin dashboard analytics. Aggregates order data by date range,
// status, and account type. All amounts are in ZAR (cents stored as Decimal, returned as
// numbers). See guidelines/13 Section 5 (reporting) and guidelines/06 (pricing tiers).
@Injectable()
export class AdminReportingService {
  constructor(private readonly prisma: PrismaService) {}

  // Revenue summary for a date range — total revenue, order count, AOV, by status.
  async revenueSummary(dateFrom?: string, dateTo?: string) {
    const where: Prisma.OrderWhereInput = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const orders = await this.prisma.order.findMany({
      where,
      select: { total: true, status: true, priceTierApplied: true, createdAt: true },
    });

    const paidOrders = orders.filter((o) => o.status !== "PENDING_PAYMENT" && o.status !== "CANCELLED");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const orderCount = orders.length;
    const paidCount = paidOrders.length;
    const aov = paidCount > 0 ? totalRevenue / paidCount : 0;

    // Revenue by price tier — RETAIL vs TRADE vs CONTRACTOR vs PROJECT.
    const byTier = paidOrders.reduce(
      (acc, o) => {
        const tier = o.priceTierApplied;
        acc[tier] = (acc[tier] ?? 0) + Number(o.total);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Order count by status.
    const byStatus = orders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalRevenue: round2(totalRevenue),
      orderCount,
      paidOrderCount: paidCount,
      aov: round2(aov),
      revenueByTier: Object.fromEntries(
        Object.entries(byTier).map(([k, v]) => [k, round2(v)]),
      ),
      ordersByStatus: byStatus,
    };
  }

  // Top products by revenue — the best-sellers for the date range.
  async topProducts(dateFrom?: string, dateTo?: string, limit = 10) {
    const where: Prisma.OrderItemWhereInput = {};
    if (dateFrom || dateTo) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo);
      where.order = { createdAt };
    }

    const items = await this.prisma.orderItem.findMany({
      where,
      select: {
        productId: true,
        quantity: true,
        unitPrice: true,
        product: { select: { sku: true, name: true } },
        order: { select: { status: true } },
      },
    });

    // Only count items from paid/processing orders. Revenue = quantity × unitPrice.
    const paidItems = items.filter((i) => i.order.status !== "PENDING_PAYMENT" && i.order.status !== "CANCELLED");

    const byProduct = new Map<string, { productName: string; sku: string; qty: number; revenue: number }>();
    for (const item of paidItems) {
      const revenue = item.quantity * Number(item.unitPrice);
      const existing = byProduct.get(item.productId);
      if (existing) {
        existing.qty += item.quantity;
        existing.revenue += revenue;
      } else {
        byProduct.set(item.productId, {
          productName: item.product.name,
          sku: item.product.sku,
          qty: item.quantity,
          revenue,
        });
      }
    }

    return Array.from(byProduct.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map((p) => ({ ...p, revenue: round2(p.revenue) }));
  }

  // Daily revenue — for the dashboard's revenue-over-time chart.
  async dailyRevenue(dateFrom: string, dateTo: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
        status: { in: ["PROCESSING", "PACKED", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED"] },
      },
      select: { total: true, createdAt: true },
    });

    const byDay = new Map<string, number>();
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + Number(o.total));
    }

    return Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => ({ date, revenue: round2(revenue) }));
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Controller("admin/orders")
@UseGuards(AdminGuard)
export class AdminOrdersController {
  constructor(private readonly service: AdminOrdersService) {}

  @Get()
  list(@Query("status") status?: OrderStatus, @Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.service.listOrders(
      status,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20
    );
  }

  @Patch(":id/status")
  transition(@Param("id") id: string, @Body() body: { status: OrderStatus }) {
    return this.service.transitionOrder(id, body.status);
  }
}

@Controller("admin/trade-accounts")
@UseGuards(AdminGuard)
export class AdminTradeAccountsController {
  constructor(private readonly service: AdminTradeAccountsService) {}

  @Get("pending")
  listPending() {
    return this.service.listPending();
  }

  @Post(":id/approve")
  approve(@Param("id") id: string) {
    return this.service.approve(id);
  }

  @Post(":id/reject")
  reject(@Param("id") id: string, @Body() body: { rejectionReason: string }) {
    return this.service.reject(id, body.rejectionReason);
  }
}

@Controller("admin/products")
@UseGuards(AdminGuard)
export class AdminProductsController {
  constructor(private readonly service: AdminProductsService) {}

  @Get()
  list(@Query("page") page?: string, @Query("pageSize") pageSize?: string, @Query("search") search?: string) {
    return this.service.listProducts(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      search
    );
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.service.updateProduct(id, body as Prisma.ProductUpdateInput);
  }
}

@Controller("admin/pricing-bands")
@UseGuards(AdminGuard)
export class AdminPricingBandsController {
  constructor(private readonly service: AdminPricingBandsService) {}

  @Get()
  list() {
    return this.service.listBands();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.service.getBand(id);
  }

  @Post()
  create(@Body() body: {
    pricingKey: string;
    retailMarkup: number;
    tradeDiscount: number;
    volumeDiscount: number;
    rationale?: string;
  }) {
    return this.service.createBand(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: {
    retailMarkup?: number;
    tradeDiscount?: number;
    volumeDiscount?: number;
    rationale?: string;
  }) {
    return this.service.updateBand(id, body);
  }
}

@Controller("admin/stock")
@UseGuards(AdminGuard)
export class AdminStockController {
  constructor(private readonly service: AdminStockService) {}

  @Get()
  list(
    @Query("locationId") locationId?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.service.listStock(
      locationId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 50
    );
  }

  @Get("low-stock")
  lowStock(@Query("threshold") threshold?: string) {
    return this.service.lowStockReport(threshold ? parseInt(threshold, 10) : 10);
  }

  @Get(":id/movements")
  movements(
    @Param("id") id: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.service.listMovements(
      id,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 50
    );
  }

  @Post(":id/adjust")
  adjust(
    @Param("id") id: string,
    @Body() body: {
      type: "RECEIVED" | "DAMAGED" | "ADJUSTED" | "TRANSFERRED_IN" | "TRANSFERRED_OUT";
      quantity: number;
      note?: string;
      reference?: string;
    }
  ) {
    return this.service.adjustStock(id, body);
  }
}

// Compliance document upload admin — wraps ComplianceService for admin-scoped operations
// (mill certs, NRCS LoAs, SABS certificates). The admin can upload a compliance doc for a
// product, list all docs for a product, and remove a doc. The fileUrl is stored — the actual
// file storage backend is decided per ADR-013 (guidelines/03 compliance section).
@Injectable()
export class AdminComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async listByProduct(productId: string) {
    return this.prisma.complianceDocument.findMany({
      where: { productId },
      orderBy: { uploadedAt: "desc" },
    });
  }

  async upload(productId: string, data: {
    type: "MILL_TEST_CERTIFICATE" | "NRCS_LETTER_OF_AUTHORITY" | "SABS_MARK_CERTIFICATE";
    fileUrl: string;
    batchRef?: string;
    issuedAt?: string;
  }) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    return this.prisma.complianceDocument.create({
      data: {
        productId,
        type: data.type,
        batchRef: data.batchRef,
        fileUrl: data.fileUrl,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : null,
      },
    });
  }

  async remove(docId: string) {
    const doc = await this.prisma.complianceDocument.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException(`Compliance document ${docId} not found`);
    await this.prisma.complianceDocument.delete({ where: { id: docId } });
    return { removed: true };
  }
}

@Controller("admin/compliance")
@UseGuards(AdminGuard)
export class AdminComplianceController {
  constructor(private readonly service: AdminComplianceService) {}

  @Get("product/:productId")
  listByProduct(@Param("productId") productId: string) {
    return this.service.listByProduct(productId);
  }

  @Post("product/:productId")
  upload(
    @Param("productId") productId: string,
    @Body() body: {
      type: "MILL_TEST_CERTIFICATE" | "NRCS_LETTER_OF_AUTHORITY" | "SABS_MARK_CERTIFICATE";
      fileUrl: string;
      batchRef?: string;
      issuedAt?: string;
    }
  ) {
    return this.service.upload(productId, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}

@Controller("admin/reports")
@UseGuards(AdminGuard)
export class AdminReportingController {
  constructor(private readonly service: AdminReportingService) {}

  @Get("revenue")
  revenueSummary(
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string
  ) {
    return this.service.revenueSummary(dateFrom, dateTo);
  }

  @Get("top-products")
  topProducts(
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("limit") limit?: string
  ) {
    return this.service.topProducts(dateFrom, dateTo, limit ? parseInt(limit, 10) : 10);
  }

  @Get("daily-revenue")
  dailyRevenue(@Query("dateFrom") dateFrom: string, @Query("dateTo") dateTo: string) {
    return this.service.dailyRevenue(dateFrom, dateTo);
  }
}

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.STOCK_ALERTS })],
  controllers: [AdminOrdersController, AdminTradeAccountsController, AdminProductsController, AdminPricingBandsController, AdminStockController, AdminComplianceController, AdminReportingController],
  providers: [AdminOrdersService, AdminTradeAccountsService, AdminProductsService, AdminPricingBandsService, AdminStockService, AdminComplianceService, AdminReportingService, PrismaService],
})
export class AdminModule {}
