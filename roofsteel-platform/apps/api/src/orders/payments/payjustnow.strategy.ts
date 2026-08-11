import { Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";
import { PaymentStrategy, PaymentSession, OrderForPayment } from "./payment-strategy.interface";

// PayJustNow — consumer BNPL (interest-free instalments), Retail tier only per
// guidelines/05-payments.md's gateway/tier table. The integration has two parts:
//   1. A PDP/cart widget showing "as low as RX/month" (frontend component).
//   2. An API-based checkout flow that creates an instalment agreement and redirects the
//      customer to PayJustNow to accept the terms.
//
// PayJustNow's API uses an API key + webhook signature (HMAC-SHA256). The initialize() call
// creates an instalment agreement; verification checks the webhook signature.

interface PayJustNowCreateResponse {
  reference: string;
  redirectUrl: string;
  status: string;
}

@Injectable()
export class PayJustNowStrategy implements PaymentStrategy {
  private readonly logger = new Logger(PayJustNowStrategy.name);
  readonly gatewayName = "PAYJUSTNOW" as const;

  private readonly merchantId = process.env.PAYJUSTNOW_MERCHANT_ID ?? "";
  private readonly apiKey = process.env.PAYJUSTNOW_API_KEY ?? "";
  private readonly apiUrl = process.env.PAYJUSTNOW_API_URL ?? "https://api.payjustnow.com";

  async initialize(order: OrderForPayment): Promise<PaymentSession> {
    if (!this.merchantId) {
      throw new Error("PAYJUSTNOW_MERCHANT_ID is not configured.");
    }

    // Create an instalment agreement via the PayJustNow API. The customer will be redirected
    // to PayJustNow to accept the terms (interest-free 3-payment instalment plan).
    const payload = {
      merchantReference: order.orderNumber,
      amount: order.total.toFixed(2),
      currency: "ZAR",
      customerEmail: order.guestEmail ?? "",
      notifyUrl: `${process.env.WEB_ORIGIN ?? ""}/v1/orders/webhooks/payjustnow`,
      // PayJustNow instalment plan type — 3 equal payments, interest-free.
      planType: "pay_in_3",
    };

    try {
      const response = await fetch(`${this.apiUrl}/v2/checkouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "X-Merchant-Id": this.merchantId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`PayJustNow API error: HTTP ${response.status} — ${errorBody}`);
        throw new Error(`PayJustNow API returned HTTP ${response.status}`);
      }

      const result = (await response.json()) as PayJustNowCreateResponse;
      return {
        gatewayReference: result.reference,
        redirectUrl: result.redirectUrl,
        requiresRedirect: true,
      };
    } catch (err) {
      this.logger.error(`PayJustNow initialize HTTP error: ${(err as Error).message}`);
      throw err;
    }
  }

  // Webhook verification — PayJustNow signs webhooks with HMAC-SHA256.
  async verify(payload: unknown, headers?: Record<string, string>): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn("PAYJUSTNOW_API_KEY not configured — rejecting webhook");
      return false;
    }

    const signature = headers?.["x-payjustnow-signature"] ?? headers?.["x-signature"] ?? "";
    if (!signature) return false;

    const body = typeof payload === "string" ? payload : JSON.stringify(payload);
    const expected = crypto
      .createHmac("sha256", this.apiKey)
      .update(body)
      .digest("hex");

    return this.timingSafeEqual(signature, expected);
  }

  // Refund — reverses/cancels the instalment agreement. Returns true only on success.
  async refund(transactionId: string, amountCents?: number): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.apiUrl}/v2/checkouts/${transactionId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          amount: amountCents ? (amountCents / 100).toFixed(2) : undefined,
        }),
      });
      if (!response.ok) {
        this.logger.error(`PayJustNow refund failed: HTTP ${response.status}`);
        return false;
      }
      const result = (await response.json()) as { status: string };
      return result.status === "APPROVED" || result.status === "SUCCESS";
    } catch (err) {
      this.logger.error(`PayJustNow refund HTTP error: ${(err as Error).message}`);
      return false;
    }
  }

  private timingSafeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a ?? "");
    const bufB = Buffer.from(b ?? "");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }
}
