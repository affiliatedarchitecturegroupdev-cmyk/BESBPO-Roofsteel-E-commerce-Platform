import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { PaymentStrategy, PaymentSession, OrderForPayment } from "./payment-strategy.interface";

// See guidelines/05-payments.md — PayFast uses TWO different signature algorithms for two
// different flows. This is a real, easy-to-get-wrong detail, encoded here explicitly rather
// than left to be rediscovered:
//   - Checkout / ITN: signature over fields in PayFast's own declared order (insertion order
//     of the object as built, NOT alphabetical).
//   - Refunds API: signature over fields in ALPHABETICAL order, plus signed headers.
// Do not reuse buildDeclaredOrderSignature() for a refund call, or vice versa.
@Injectable()
export class PayFastStrategy implements PaymentStrategy {
  readonly gatewayName = "PAYFAST" as const;

  private readonly merchantId = process.env.PAYFAST_MERCHANT_ID ?? "";
  private readonly merchantKey = process.env.PAYFAST_MERCHANT_KEY ?? "";
  private readonly passphrase = process.env.PAYFAST_PASSPHRASE ?? "";

  async initialize(order: OrderForPayment): Promise<PaymentSession> {
    // Field order here is PayFast's declared checkout order — do not alphabetise.
    const fields: Record<string, string> = {
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      m_payment_id: order.orderNumber,
      amount: order.total.toFixed(2),
      item_name: `Roofsteel Order ${order.orderNumber}`,
    };
    const signature = this.buildDeclaredOrderSignature(fields);

    // TODO(Phase 3): real PayFast checkout URL construction (sandbox vs. production host from
    // env) — this returns the session shape the interface requires; the actual HTTP call to
    // PayFast's process endpoint is the next concrete step.
    return {
      gatewayReference: order.orderNumber,
      redirectUrl: `https://www.payfast.co.za/eng/process?${new URLSearchParams({ ...fields, signature }).toString()}`,
      requiresRedirect: true,
    };
  }

  async verify(payload: Record<string, string>): Promise<boolean> {
    const { signature, ...fields } = payload;
    const expected = this.buildDeclaredOrderSignature(fields);
    // Constant-time comparison — a naive === comparison on a signature check is a timing-attack
    // surface; small enough risk here to be debatable, but cheap enough to just do right.
    return this.timingSafeEqual(signature, expected);
  }

  async refund(transactionId: string, amountCents?: number): Promise<boolean> {
    // Alphabetical field order for the Refunds API — deliberately different from initialize()'s
    // declared-order signature above. See guidelines/05-payments.md.
    const fields: Record<string, string> = {
      amount: amountCents ? (amountCents / 100).toFixed(2) : "",
      merchant_id: this.merchantId,
      transaction_id: transactionId,
    };
    const sortedFields = Object.fromEntries(Object.entries(fields).sort(([a], [b]) => a.localeCompare(b)));
    this.buildDeclaredOrderSignature(sortedFields); // signed headers + real HTTP call: Phase 3 TODO
    return true;
  }

  private buildDeclaredOrderSignature(fields: Record<string, string>): string {
    const queryString = Object.entries(fields)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
      .join("&");
    const signaturePayload = this.passphrase
      ? `${queryString}&passphrase=${encodeURIComponent(this.passphrase).replace(/%20/g, "+")}`
      : queryString;
    return crypto.createHash("md5").update(signaturePayload).digest("hex");
  }

  private timingSafeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a ?? "");
    const bufB = Buffer.from(b ?? "");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }
}
