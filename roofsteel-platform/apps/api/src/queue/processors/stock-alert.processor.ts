import { Processor, Process } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import type { Job } from "bull";

// Stock alert processor — handles back-in-stock and low-stock notification jobs.
// Job data: { productId, productSku, productName, alertType, threshold? }
// Alert types: 'low_stock', 'back_in_stock'
//
// When a product goes below its low-stock threshold, a 'low_stock' job is enqueued to
// notify admins. When stock is replenished after being out of stock, a 'back_in_stock'
// job is enqueued to notify customers who wishlist-registered for the product.
// See guidelines/09-notifications-and-jobs.md and guidelines/13 Section 3.2.

export interface StockAlertJob {
  productId: string;
  productSku: string;
  productName: string;
  alertType: "low_stock" | "back_in_stock";
  threshold?: number;
  currentStock?: number;
}

@Processor("stock-alerts")
export class StockAlertProcessor {
  private readonly logger = new Logger(StockAlertProcessor.name);

  @Process()
  async handleStockAlert(job: Job<StockAlertJob>) {
    const { productSku, productName, alertType } = job.data;
    this.logger.log(`Processing stock alert: ${productSku} (${productName}) — ${alertType}`);

    switch (alertType) {
      case "low_stock":
        await this.sendLowStockAlert(job.data);
        break;
      case "back_in_stock":
        await this.sendBackInStockNotifications(job.data);
        break;
      default:
        this.logger.warn(`Unknown stock alert type: ${alertType}`);
    }
  }

  // Notify admins (or restock managers) that a product is at/below the low-stock threshold.
  private async sendLowStockAlert(data: StockAlertJob) {
    this.logger.log(
      `Low-stock alert: ${data.productSku} at ${data.currentStock} units (threshold: ${data.threshold ?? 10})`
    );
    // TODO(4.12): real admin notification — email/Slack to restock managers
  }

  // Notify customers who wishlisted the product that it's back in stock.
  private async sendBackInStockNotifications(data: StockAlertJob) {
    this.logger.log(`Back-in-stock notifications: ${data.productSku} (${data.productName})`);
    // TODO(4.12): query Wishlist entries for this productId, send notification to each
  }
}
