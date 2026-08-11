import { Module, Controller, Get, Post, Param, UseGuards, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { AdminGuard } from "../auth/admin.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentAccount } from "../auth/current-account.decorator";
import type { JwtPayload } from "../auth/auth.service";
import { CourierService } from "./courier.service";
import { Province } from "@prisma/client";

// Courier controller — exposes shipment booking (admin) and tracking (customer + admin).
// Booking is admin-only: a shipment is booked when an order is DISPATCHED, which is an
// admin action. Tracking is customer-facing: an authenticated customer can track any order
// they own; admin can track any order.

@Injectable()
export class CourierOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courier: CourierService,
  ) {}

  // Book a shipment for an order — admin only. Reads the order + delivery address, calls
  // the courier provider, and stores the tracking number on the order.
  async bookOrderShipment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        deliveryAddress: true,
        account: { select: { name: true, email: true, phone: true } },
      },
    });
    if (!order) throw new Error(`Order ${orderId} not found`);

    const totalWeightKg = order.items.reduce(
      (sum, item) => sum + item.quantity * 0.5, // approximate — real weight is on Product.weightKgPerUnit
      0,
    );

    const addr = order.deliveryAddress;
    const shipment = await this.courier.bookShipment({
      orderNumber: order.orderNumber,
      recipientName: order.account?.name ?? order.guestEmail ?? "Recipient",
      recipientEmail: order.account?.email ?? order.guestEmail ?? undefined,
      addressLine1: addr?.line1 ?? "",
      addressLine2: addr?.line2 ?? undefined,
      city: addr?.city ?? "",
      province: (addr?.province ?? order.province) as Province,
      postalCode: addr?.postalCode ?? "",
      totalWeightKg,
      parcelCount: Math.max(1, Math.ceil(totalWeightKg / 25)),
    });

    // Store tracking number and transition to DISPATCHED.
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentRef: shipment.trackingNumber, // reuse paymentRef for tracking — TODO: dedicated field
        status: "DISPATCHED",
      },
    });

    return { order: updated, shipment };
  }

  // Track a shipment by order — reads the tracking number from the order, calls the courier.
  async trackOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (!order.paymentRef) throw new Error(`Order ${orderId} has no tracking number`);

    return this.courier.trackShipment(order.paymentRef);
  }
}

@Controller("admin/courier")
@UseGuards(AdminGuard)
export class AdminCourierController {
  constructor(private readonly service: CourierOrderService) {}

  @Post("orders/:id/book")
  book(@Param("id") id: string) {
    return this.service.bookOrderShipment(id);
  }

  @Get("orders/:id/track")
  track(@Param("id") id: string) {
    return this.service.trackOrder(id);
  }
}

@Controller("courier")
export class CourierController {
  constructor(
    private readonly service: CourierOrderService,
    private readonly prisma: PrismaService,
  ) {}

  // Customer-facing tracking — an authenticated user can track their own order.
  @Get("orders/:orderNumber/track")
  @UseGuards(JwtAuthGuard)
  async track(@CurrentAccount() account: JwtPayload, @Param("orderNumber") orderNumber: string) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (!order) throw new Error(`Order ${orderNumber} not found`);
    if (order.accountId !== account.sub) {
      throw new Error("You can only track your own orders");
    }
    return this.service.trackOrder(order.id);
  }
}

@Module({
  controllers: [AdminCourierController, CourierController],
  providers: [CourierService, CourierOrderService, PrismaService],
  exports: [CourierService],
})
export class CourierModule {}
