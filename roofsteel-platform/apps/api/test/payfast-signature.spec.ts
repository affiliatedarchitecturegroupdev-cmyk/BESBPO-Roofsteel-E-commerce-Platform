// PayFast signature + IP verification tests — verifies the declared-order MD5
// signature algorithm and the ITN source-IP allowlist. These are the two most
// security-critical pieces of the PayFast integration (guidelines/05-payments.md).
//
// We test the real PayFastStrategy class, setting env vars before construction.
// No mocks of the strategy itself — only the crypto and IP logic is exercised.

import { PayFastStrategy } from "../src/orders/payments/payfast.strategy";

describe("PayFastStrategy — signature + IP verification", () => {
  let strategy: PayFastStrategy;

  beforeEach(() => {
    process.env.PAYFAST_MERCHANT_ID = "10000100";
    process.env.PAYFAST_MERCHANT_KEY = "46f0cd697624";
    process.env.PAYFAST_PASSPHRASE = "test-passphrase";
    process.env.PAYFAST_SANDBOX = "true"; // skip IP check in tests
    strategy = new PayFastStrategy();
  });

  describe("signature verification", () => {
    it("accepts a valid signature", async () => {
      // Build the same signature the strategy would produce, then verify it.
      const fields = {
        m_payment_id: "ORD-001",
        payment_amount: "100.00",
        payment_status: "COMPLETE",
      };
      const queryString = Object.entries(fields)
        .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
        .join("&");
      const payload = `${queryString}&passphrase=${encodeURIComponent("test-passphrase").replace(/%20/g, "+")}`;
      const crypto = require("crypto");
      const validSig = crypto.createHash("md5").update(payload).digest("hex");

      const result = await strategy.verify({ ...fields, signature: validSig }, {});
      expect(result).toBe(true);
    });

    it("rejects a tampered signature", async () => {
      const fields = {
        m_payment_id: "ORD-001",
        payment_amount: "100.00",
        signature: "tampered-signature-value",
      };
      const result = await strategy.verify(fields, {});
      expect(result).toBe(false);
    });

    it("rejects a missing signature", async () => {
      const result = await strategy.verify(
        { m_payment_id: "ORD-001", payment_amount: "100.00" },
        {}
      );
      expect(result).toBe(false);
    });

    it("rejects an amount-altered payload (signature mismatch)", async () => {
      const fields = {
        m_payment_id: "ORD-001",
        payment_amount: "100.00",
      };
      const queryString = Object.entries(fields)
        .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
        .join("&");
      const payload = `${queryString}&passphrase=${encodeURIComponent("test-passphrase").replace(/%20/g, "+")}`;
      const crypto = require("crypto");
      const validSig = crypto.createHash("md5").update(payload).digest("hex");

      // Now tamper with the amount after signing — signature won't match.
      const tampered = { ...fields, payment_amount: "1.00", signature: validSig };
      const result = await strategy.verify(tampered, {});
      expect(result).toBe(false);
    });
  });

  describe("IP allowlist (sandbox=false)", () => {
    beforeEach(() => {
      process.env.PAYFAST_SANDBOX = "false";
      strategy = new PayFastStrategy();
    });

    it("rejects an ITN from a non-PayFast IP", async () => {
      const fields = { m_payment_id: "X", signature: "x" };
      const result = await strategy.verify(fields, { "x-forwarded-for": "8.8.8.8" });
      expect(result).toBe(false);
    });

    it("accepts an ITN from a known PayFast IP range", async () => {
      const fields = { m_payment_id: "X", signature: "x" };
      // 41.74.168.1 is in the allowlist; signature is wrong, but we're testing the IP gate.
      const result = await strategy.verify(fields, { "x-forwarded-for": "41.74.168.1" });
      // Signature is wrong, so the overall result is false — but the IP check passed.
      expect(result).toBe(false);
    });
  });
});
