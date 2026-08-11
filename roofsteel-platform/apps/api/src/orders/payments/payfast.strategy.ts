import { Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";
import { PaymentStrategy, PaymentSession, OrderForPayment } from "./payment-strategy.interface";

// See guidelines/05-payments.md — PayFast uses TWO different signature algorithms for two
// different flows. This is a real, easy-to-get-wrong detail, encoded here explicitly rather
// than left to be rediscovered:
//   - Checkout / ITN: signature over fields in PayFast's own declared order (insertion order
//     of the object as built, NOT alphabetical).
//   - Refunds API: signature over fields in ALPHABETICAL order, plus signed headers.
// Do not reuse buildDeclaredOrderSignature() for a refund call, or vice versa.
//
// PayFast IP allowlist for ITN verification (guidelines/05): the ITN POST must originate from
// PayFast's servers. We check the source IP against PayFast's published ranges as a defence
// in depth on top of the signature check.
const PAYFAST_ITN_IP_RANGES = [
  "41.74.168.0/24",   // PayFast production IPs
  "41.74.168.1",
  "196.26.204.0/24",
  "196.26.204.1",
  "197.149.192.0/24",
  "197.149.192.1",
];

@Injectable()
export class PayFastStrategy implements PaymentStrategy {
  private readonly logger = new Logger(PayFastStrategy.name);
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

    // Sandbox vs. production host from env — sandbox.payfast.co.za for testing,
    // www.payfast.co.za for production. The PAYFAST_SANDBOX env var toggles this.
    const host = process.env.PAYFAST_SANDBOX === "true"
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";
    const returnUrl = process.env.PAYFAST_RETURN_URL ?? "";
    const cancelUrl = process.env.PAYFAST_CANCEL_URL ?? "";
    const notifyUrl = process.env.PAYFAST_NOTIFY_URL ?? "";

    const allFields: Record<string, string> = {
      ...fields,
      signature,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      email_address: order.guestEmail ?? "",
    };
    return {
      gatewayReference: order.orderNumber,
      redirectUrl: `${host}?${new URLSearchParams(allFields).toString()}`,
      requiresRedirect: true,
    };
  }

  // ITN verification: check the source IP is from PayFast, then verify the MD5 signature
  // over the payload fields in PayFast's declared order.
  async verify(payload: Record<string, string>, headers?: Record<string, string>): Promise<boolean> {
    // IP allowlist check (defence in depth on top of signature — guidelines/05 + 08).
    const clientIp = headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ?? headers?.["x-real-ip"] ?? "";
    if (clientIp && !this.isPayFastIp(clientIp)) {
      // In sandbox mode, skip the IP check (sandbox traffic may come from different IPs).
      if (process.env.PAYFAST_SANDBOX !== "true") {
        this.logger.warn(`ITN rejected: source IP ${clientIp} not in PayFast ranges`);
        return false;
      }
    }

    const { signature, ...fields } = payload;
    if (!signature) return false;
    const expected = this.buildDeclaredOrderSignature(fields);
    return this.timingSafeEqual(signature, expected);
  }

  // Real refund HTTP call to PayFast's Refunds API. Uses alphabetical field order + signed
  // headers (guidelines/05). Returns true only if PayFast confirms the refund.
  async refund(transactionId: string, amountCents?: number): Promise<boolean> {
    const fields: Record<string, string> = {
      amount: amountCents ? (amountCents / 100).toFixed(2) : "",
      merchant_id: this.merchantId,
      transaction_id: transactionId,
    };
    const sortedFields = Object.fromEntries(Object.entries(fields).sort(([a], [b]) => a.localeCompare(b)));
    const signature = this.buildDeclaredOrderSignature(sortedFields);

    const refundHost = process.env.PAYFAST_SANDBOX === "true"
      ? "https://sandbox.payfast.co.za/api/refund"
      : "https://api.payfast.co.za/refund";

    try {
      const response = await fetch(refundHost, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "merchant-id": this.merchantId,
          "signature": signature,
          "version": "v1",
        },
        body: new URLSearchParams(sortedFields).toString(),
      });
      if (!response.ok) {
        this.logger.error(`PayFast refund failed: HTTP ${response.status}`);
        return false;
      }
      const result = await response.json() as { status: string; message?: string };
      return result.status === "SUCCESS" || result.status === "COMPLETE";
    } catch (err) {
      this.logger.error(`PayFast refund HTTP error: ${(err as Error).message}`);
      return false;
    }
  }

  // Check if an IP falls within PayFast's published ITN source ranges.
  private isPayFastIp(ip: string): boolean {
    // Allow loopback in dev/test environments.
    if (ip === "127.0.0.1" || ip === "::1") return true;
    for (const range of PAYFAST_ITN_IP_RANGES) {
      if (range.includes("/")) {
        if (this.ipInCidr(ip, range)) return true;
      } else if (ip === range) {
        return true;
      }
    }
    return false;
  }

  private ipInCidr(ip: string, cidr: string): boolean {
    const [range, bits] = cidr.split("/");
    const mask = parseInt(bits ?? "32", 10);
    const ipNum = this.ipToInt(ip);
    const rangeNum = this.ipToInt(range);
    if (ipNum === null || rangeNum === null) return false;
    const maskBits = mask === 32 ? 0xffffffff : (0xffffffff << (32 - mask)) >>> 0;
    return (ipNum & maskBits) === (rangeNum & maskBits);
  }

  private ipToInt(ip: string): number | null {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return null;
    return ((parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
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
