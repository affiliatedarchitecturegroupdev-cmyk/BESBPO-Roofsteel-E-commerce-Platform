import { Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";
import { PaymentStrategy, PaymentSession, OrderForPayment } from "./payment-strategy.interface";

// Lulapay — B2B invoice-financing BNPL, approved for integration per docs/DECISIONS.md ADR-006.
// Roofsteel is paid upfront in full; Lulapay collects from the trade customer over 30-90 days
// (up to 6 months) and carries the credit assessment/collection risk itself. See
// guidelines/05-payments.md for the full reasoning.
//
// The Partner API uses HMAC-SHA256 webhook signing (typical for B2B BNPL APIs). The initialize()
// call creates an invoice/loan request via the Partner API, which returns a reference and
// (optionally) a redirect URL for the customer to accept the terms. For trade-credit flows,
// the customer may not need to leave the site — the confirmation is asynchronous via webhook.
//
// Until LULAPAY_API_KEY is set, initialize() throws rather than silently returning a fake
// session — a payment gateway that appears to work but isn't real is a worse failure mode
// than an honest "not configured yet" error.

interface LulapayCreateResponse {
  reference: string;
  status: string;
  redirectUrl?: string;
}

@Injectable()
export class LulapayStrategy implements PaymentStrategy {
  private readonly logger = new Logger(LulapayStrategy.name);
  readonly gatewayName = "LULAPAY" as const;

  private readonly apiKey = process.env.LULAPAY_API_KEY ?? "";
  private readonly apiUrl = process.env.LULAPAY_API_URL ?? "https://api.lulapay.co.za";
  private readonly webhookSecret = process.env.LULAPAY_WEBHOOK_SECRET ?? "";

  async initialize(order: OrderForPayment): Promise<PaymentSession> {
    if (!this.apiKey) {
      throw new Error(
        "LULAPAY_API_KEY is not configured — Partner onboarding is approved (ADR-006) but the " +
          "real API credential hasn't been issued yet. See guidelines/05-payments.md."
      );
    }

    // Real Partner API call — creates an invoice-financing request. The customer (trade buyer)
    // is assessed by Lulapay; Roofsteel receives payment upfront once Lulapay approves.
    // The request shape follows the typical B2B BNPL Partner API contract: merchant reference,
    // amount, customer identifier, and the webhook URL for async status updates.
    const payload = {
      merchantReference: order.orderNumber,
      amount: order.total.toFixed(2),
      currency: "ZAR",
      customerEmail: order.guestEmail ?? "",
      customerId: order.accountId ?? "",
      notifyUrl: `${process.env.WEB_ORIGIN ?? ""}/v1/orders/webhooks/lulapay`,
    };

    try {
      const response = await fetch(`${this.apiUrl}/v1/partner/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "X-Partner-Key": this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Lulapay API error: HTTP ${response.status} — ${errorBody}`);
        throw new Error(`Lulapay Partner API returned HTTP ${response.status}`);
      }

      const result = (await response.json()) as LulapayCreateResponse;
      return {
        gatewayReference: result.reference,
        redirectUrl: result.redirectUrl,
        requiresRedirect: Boolean(result.redirectUrl),
      };
    } catch (err) {
      this.logger.error(`Lulapay initialize HTTP error: ${(err as Error).message}`);
      throw err;
    }
  }

  // Webhook verification — Lulapay signs webhooks with HMAC-SHA256 using the webhook secret.
  // The signature is in the X-Lulapay-Signature header, computed over the raw request body.
  async verify(payload: unknown, headers?: Record<string, string>): Promise<boolean> {
    if (!this.webhookSecret) {
      this.logger.warn("LULAPAY_WEBHOOK_SECRET not configured — rejecting webhook");
      return false;
    }

    const signature = headers?.["x-lulapay-signature"] ?? headers?.["x-signature"] ?? "";
    if (!signature) return false;

    // Recompute the HMAC-SHA256 over the raw body. Since NestJS parses JSON before we get it,
    // we use a stable JSON serialization here — in production, use raw body middleware for
    // exact-byte verification (guidelines/08-security-and-compliance.md).
    const body = typeof payload === "string" ? payload : JSON.stringify(payload);
    const expected = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(body)
      .digest("hex");

    return this.timingSafeEqual(signature, expected);
  }

  // Refund — routes through the Partner API. For invoice-financing, a "refund" is actually a
  // credit note / invoice cancellation, not a simple reversal. Returns true only on success.
  async refund(transactionId: string, amountCents?: number): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.apiUrl}/v1/partner/invoices/${transactionId}/credit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          amount: amountCents ? (amountCents / 100).toFixed(2) : undefined,
          reason: "customer_refund",
        }),
      });
      if (!response.ok) {
        this.logger.error(`Lulapay refund failed: HTTP ${response.status}`);
        return false;
      }
      const result = (await response.json()) as { status: string };
      return result.status === "APPROVED" || result.status === "SUCCESS";
    } catch (err) {
      this.logger.error(`Lulapay refund HTTP error: ${(err as Error).message}`);
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
