"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { tradeAccountsApi } from "../../../lib/api-client";

// Trade account status — shows one of four real states (not applied / pending / approved /
// rejected with reason). The backend (GET /v1/trade-accounts/me) is real. If no application
// exists, a CTA to apply is shown. If pending, a waiting state. If approved, trade pricing
// is live. If rejected, the reason and a re-apply option.
export default function TradeAccountStatusPage() {
  const [status, setStatus] = useState<null | { status: string; companyName: string; rejectionReason?: string }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tradeAccountsApi
      .getMine()
      .then((data: any) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: "32px 16px", maxWidth: 600 }}>
        <h1>Trade Account</h1>
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 600 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Trade Account</h1>
        <Link href="/account" style={{ fontSize: 14, color: "var(--steel)" }}>← Back to Account</Link>
      </div>

      {!status ? (
        <div style={{ marginTop: 24, padding: 24, border: "1px solid var(--steel-light)", borderRadius: 8 }}>
          <h2 style={{ fontSize: 18 }}>Apply for Trade Pricing</h2>
          <p style={{ fontSize: 14, color: "var(--steel)", marginTop: 8, marginBottom: 16 }}>
            Trade accounts get access to tiered pricing, bulk discounts, and pay-later options through Lulapay.
          </p>
          <Link href="/trade/apply" className="btn btn-primary">Start Application</Link>
        </div>
      ) : (
        <div style={{ marginTop: 24, padding: 24, border: "1px solid var(--steel-light)", borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 600 }}>{status.companyName}</p>
              <span style={{
                display: "inline-block",
                marginTop: 8,
                padding: "4px 12px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                background: status.status === "APPROVED" ? "var(--success)" : status.status === "REJECTED" ? "var(--orange-dark)" : "var(--steel-light)",
                color: "white",
              }}>
                {status.status}
              </span>
            </div>
          </div>

          {status.status === "PENDING" && (
            <p style={{ fontSize: 14, color: "var(--steel)", marginTop: 16 }}>
              Your application is under review. We&apos;ll email you when it&apos;s approved.
            </p>
          )}
          {status.status === "APPROVED" && (
            <p style={{ fontSize: 14, color: "var(--success)", marginTop: 16 }}>
              Your trade account is active. You now see trade pricing across the catalogue.
            </p>
          )}
          {status.status === "REJECTED" && (
            <div>
              <p style={{ fontSize: 14, color: "var(--orange-dark)", marginTop: 16 }}>
                Your application was declined: {status.rejectionReason ?? "No reason provided."}
              </p>
              <Link href="/trade/apply" className="btn btn-outline-dark" style={{ marginTop: 12 }}>
                Re-apply
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
