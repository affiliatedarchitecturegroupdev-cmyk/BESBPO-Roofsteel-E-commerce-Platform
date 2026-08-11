import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { OrderNotificationProcessor } from "./processors/order-notification.processor";
import { TradeApplicationProcessor } from "./processors/trade-application.processor";
import { StockAlertProcessor } from "./processors/stock-alert.processor";

// Queue module — sets up BullMQ queues backed by Redis (REDIS_URL env var). Each queue has
// a dedicated processor (worker) that handles jobs asynchronously. This decouples slow
// operations (sending emails, generating PDFs, webhook retries) from the request-response
// cycle, matching guidelines/09-notifications-and-jobs.md's architecture.
//
// Queue names are constants, not magic strings scattered across the codebase — a typo in a
// queue name would silently lose jobs. Export the queue injection tokens from here.

export const QUEUE_NAMES = {
  ORDER_NOTIFICATIONS: "order-notifications",
  TRADE_APPLICATIONS: "trade-applications",
  STOCK_ALERTS: "stock-alerts",
} as const;

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => {
        const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");
        return {
          redis: {
            host: url.hostname,
            port: parseInt(url.port || "6379", 10),
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.ORDER_NOTIFICATIONS },
      { name: QUEUE_NAMES.TRADE_APPLICATIONS },
      { name: QUEUE_NAMES.STOCK_ALERTS },
    ),
  ],
  providers: [
    OrderNotificationProcessor,
    TradeApplicationProcessor,
    StockAlertProcessor,
  ],
  exports: [BullModule],
})
export class QueueModule {}
