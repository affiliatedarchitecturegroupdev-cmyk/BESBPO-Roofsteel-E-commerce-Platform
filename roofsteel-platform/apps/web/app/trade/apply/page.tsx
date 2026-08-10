"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { tradeAccountsApi } from "../../lib/api-client";

// Trade account application form — calls POST /v1/trade-accounts/apply (real backend).
// Fields match ApplyForTradeAccountDto: companyName (required), registrationNo (optional).
// The authenticated account ID is resolved server-side from the JWT, not sent in the body.
export default function TradeApplyPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await tradeAccountsApi.apply(companyName, registrationNo || undefined);
      router.push("/account/trade-account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 480 }}>
      <h1>Apply for a Trade Account</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8, marginBottom: 24 }}>
        Trade accounts get access to tiered pricing, bulk discounts, and pay-later options through Lulapay.
      </p>

      {error && <div className="form-error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label className="form-label">
          Company name
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="form-input"
          />
        </label>

        <label className="form-label">
          Company registration number <span style={{ color: "var(--steel)", fontSize: 12 }}>(optional)</span>
          <input
            type="text"
            value={registrationNo}
            onChange={(e) => setRegistrationNo(e.target.value)}
            className="form-input"
          />
        </label>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Submitting…" : "Submit Application"}
        </button>
      </form>

      <p style={{ marginTop: 24, fontSize: 14, color: "var(--steel)" }}>
        <Link href="/account/trade-account" style={{ color: "var(--orange)" }}>Check application status</Link>
      </p>
    </div>
  );
}
