import { Processor, Process, InjectQueue } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import type { Job } from "bull";
import type { Queue } from "bull";

// Order notification processor — handles jobs enqueued when an order transitions status.
// Job data: { orderNumber, eventType, accountId?, guestEmail? }
// Event types: 'created', 'paid', 'shipped', 'delivered', 'cancelled'
//
// The processor is a skeleton — the actual email/PDF rendering is wired in task 4.10.
// The queue itself (task 4.9) is the infrastructure; the jobs are the payload.
// See guidelines/09-notifications-and-jobs.md for the notification matrix.

export interface OrderNotificationJob {
  orderNumber: string;
  eventType: "created" | "paid" | "shipped" | "delivered" | "cancelled";
  accountId?: string;
  guestEmail?: string;
}

@Processor("order-notifications")
export class OrderNotificationProcessor {
  private readonly logger = new Logger(OrderNotificationProcessor.name);

  @Process()
  async handleOrderNotification(job: Job<OrderNotificationJob>) {
    const { orderNumber, eventType } = job.data;
    this.logger.log(`Processing order notification: ${orderNumber} — ${eventType}`);

    switch (eventType) {
      case "created":
        await this.sendOrderConfirmation(job.data);
        break;
      case "paid":
        await this.sendPaymentConfirmation(job.data);
        break;
      case "shipped":
        await this.sendShippingNotification(job.data);
        break;
      case "delivered":
        await this.sendDeliveryConfirmation(job.data);
        break;
      case "cancelled":
        await this.sendCancellationNotification(job.data);
        break;
      default:
        this.logger.warn(`Unknown order event type: ${eventType}`);
    }
  }

  private async sendOrderConfirmation(data: OrderNotificationJob) {
    this.logger.log(`Order confirmation email queued for ${data.orderNumber}`);
    // TODO(4.10): real email rendering + SMTP send
  }

  private async sendPaymentConfirmation(data: OrderNotificationJob) {
    this.logger.log(`Payment confirmation email queued for ${data.orderNumber}`);
  }

  private async sendShippingNotification(data: OrderNotificationJob) {
    this.logger.log(`Shipping notification email queued for ${data.orderNumber}`);
  }

  private async sendDeliveryConfirmation(data: OrderNotificationJob) {
    this.logger.log(`Delivery confirmation email queued for ${data.orderNumber}`);
  }

  private async sendCancellationNotification(data: OrderNotificationJob) {
    this.logger.log(`Cancellation notification email queued for ${data.orderNumber}`);
  }
}
