import {
  Module, Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Injectable,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { AdminGuard } from "../auth/admin.guard";
import { OrderStatus, Prisma } from "@prisma/client";

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
        { name: { search } },
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

@Module({
  controllers: [AdminOrdersController, AdminTradeAccountsController, AdminProductsController],
  providers: [AdminOrdersService, AdminTradeAccountsService, AdminProductsService, PrismaService],
})
export class AdminModule {}
