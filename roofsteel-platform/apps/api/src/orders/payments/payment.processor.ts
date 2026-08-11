import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { PrismaService } from "../../common/prisma.service";
import { InventoryService } from "../../inventory/inventory.service";
import { OrderStatus } from "@prisma/client";
import { QUEUE_NAMES } from "../../queue/queue.module";
import type { OrderNotificationJob } from "../../queue/processors/order-notification.processor";

// Centralised payment-event processor — every webhook path routes through this single
// transition function. This prevents double-fulfilment across all three gateways: the
// status check before applying any transition is the one idempotency gate, not three
// separate checks in three separate webhook handlers (guidelines/05-payments.md, 09).
//
// Transition rules (guidelines/05 "Order status transitions triggered by payment events"):
//   PENDING_PAYMENT → PROCESSING  (verified payment confirmation)
//   PROCESSING → CANCELLED        (refund or admin cancel — releases reserved stock)
//   Any → no-op if already in a terminal/advanced state (idempotency)

@Injectable()
export class PaymentProcessor {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    @InjectQueue(QUEUE_NAMES.ORDER_NOTIFICATIONS) private readonly orderQueue: Queue<OrderNotificationJob>,
  ) {}

  // Called by every gateway's webhook handler after signature verification succeeds.
  // Returns the order in its current state — whether it was transitioned or not.
  async confirmPayment(orderNumber: string, gatewayReference?: string): Promise<{ order: unknown; transitioned: boolean }> {
    const order = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (!order) throw new NotFoundException(`Order ${orderNumber} not found`);

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      // Already processed — idempotent no-op. A retried webhook must never double-process.
      this.logger.log(`Order ${orderNumber} already in ${order.status}, skipping payment confirmation`);
      return { order, transitioned: false };
    }

    // Transition PENDING_PAYMENT → PROCESSING, record the gateway reference, and convert
    // reserved stock to sold (the order is now committed — stock is no longer just reserved).
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PROCESSING,
          paidAt: new Date(),
          paymentRef: gatewayReference ?? order.paymentRef,
        },
      });
      return result;
    });

    // Confirm the sale in inventory (outside the order transaction — if this fails, the order
    // is still PAID, and a separate reconciliation job can fix the stock state).
    try {
      await this.inventory.confirmSale(order.id);
    } catch (err) {
      this.logger.error(`Stock confirmation failed for order ${orderNumber}: ${(err as Error).message}`);
    }

    this.logger.log(`Order ${orderNumber} confirmed: PENDING_PAYMENT → PROCESSING`);

    // Enqueue paid notification (guidelines/09). Only when transitioned — a retried webhook
    // for an already-paid order must not re-send the confirmation email (idempotency).
    await this.orderQueue.add("paid", {
      orderNumber,
      eventType: "paid",
      accountId: order.accountId ?? undefined,
      guestEmail: order.guestEmail ?? undefined,
    });

    return { order: updated, transitioned: true };
  }

  // Cancel an order — releases reserved stock back to qtyOnHand. Called on admin cancel or
  // when the payment window expires without a successful payment.
  async cancelOrder(orderNumber: string, reason?: string): Promise<{ order: unknown; transitioned: boolean }> {
    const order = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (!order) throw new NotFoundException(`Order ${orderNumber} not found`);

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      return { order, transitioned: false };
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason ?? "payment_window_expired",
      },
    });

    try {
      await this.inventory.releaseStock(order.id);
    } catch (err) {
      this.logger.error(`Stock release failed for cancelled order ${orderNumber}: ${(err as Error).message}`);
    }

    this.logger.log(`Order ${orderNumber} cancelled: ${order.status} → CANCELLED`);
    return { order: updated, transitioned: true };
  }
}
