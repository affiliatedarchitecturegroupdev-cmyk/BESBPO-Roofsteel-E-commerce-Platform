import { Injectable } from "@nestjs/common";
import { PaymentStrategy, PaymentSession, OrderForPayment } from "./payment-strategy.interface";

// PayJustNow — consumer BNPL, Retail tier only per guidelines/05-payments.md's gateway/tier
// table. OrdersService is responsible for not offering this gateway outside Retail; this class
// doesn't re-check the tier itself, matching the Strategy Pattern's separation of concerns
// (guidelines/05-payments.md) — a strategy class executes a payment, it doesn't decide
// business eligibility.
@Injectable()
export class PayJustNowStrategy implements PaymentStrategy {
  readonly gatewayName = "PAYJUSTNOW" as const;

  private readonly merchantId = process.env.PAYJUSTNOW_MERCHANT_ID ?? "";

  async initialize(order: OrderForPayment): Promise<PaymentSession> {
    if (!this.merchantId) {
      throw new Error("PAYJUSTNOW_MERCHANT_ID is not configured.");
    }
    // TODO(Phase 3): real PayJustNow widget/API integration — instalment agreement creation.
    return {
      gatewayReference: `pjn-${order.orderNumber}`,
      requiresRedirect: true,
    };
  }

  async verify(_payload: unknown): Promise<boolean> {
    return false; // TODO(Phase 3): real signature/callback verification.
  }

  async refund(_transactionId: string, _amountCents?: number): Promise<boolean> {
    return false; // TODO(Phase 3): real refund flow — likely reverses the instalment agreement.
  }
}
