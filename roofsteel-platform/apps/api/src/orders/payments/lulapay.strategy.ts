import { Injectable } from "@nestjs/common";
import { PaymentStrategy, PaymentSession, OrderForPayment } from "./payment-strategy.interface";

// Lulapay — B2B invoice-financing BNPL, approved for integration per docs/DECISIONS.md ADR-006.
// Roofsteel is paid upfront in full; Lulapay collects from the trade customer over 30-90 days
// (up to 6 months) and carries the credit assessment/collection risk itself. See
// guidelines/05-payments.md for the full reasoning — this solves the "no registered credit
// intermediary" gap the group's other e-commerce platforms flagged as open and unsolved.
//
// Partner onboarding is approved and proceeding; the real Partner API key is still pending.
// Until LULAPAY_API_KEY is set, initialize() throws rather than silently returning a fake
// session — a payment gateway that appears to work but isn't real is a worse failure mode
// than an honest "not configured yet" error.
@Injectable()
export class LulapayStrategy implements PaymentStrategy {
  readonly gatewayName = "LULAPAY" as const;

  private readonly apiKey = process.env.LULAPAY_API_KEY ?? "";

  async initialize(order: OrderForPayment): Promise<PaymentSession> {
    if (!this.apiKey) {
      throw new Error(
        "LULAPAY_API_KEY is not configured — Partner onboarding is approved (ADR-006) but the " +
          "real API credential hasn't been issued yet. See guidelines/05-payments.md."
      );
    }

    // TODO(Phase 3): real Lulapay Partner API call once credentials exist. Confirm the actual
    // integration contract with Lulapay directly rather than guessing at a request/response
    // shape from public marketing material — see guidelines/05-payments.md's explicit warning
    // on this point.
    return {
      gatewayReference: `lulapay-${order.orderNumber}`,
      requiresRedirect: false, // trade-credit-style flow — no customer-facing redirect
    };
  }

  async verify(_payload: unknown): Promise<boolean> {
    // TODO(Phase 3): real webhook signature verification once the Partner API contract is
    // confirmed. Deliberately returns false (not true) until real verification exists — never
    // default a payment verification stub to "trust everything."
    return false;
  }

  async refund(_transactionId: string, _amountCents?: number): Promise<boolean> {
    // TODO(Phase 3): Lulapay refund flow — likely routes through their Partner dashboard/API
    // rather than a simple reversal, given the invoice-financing model. Confirm with Lulapay.
    return false;
  }
}
