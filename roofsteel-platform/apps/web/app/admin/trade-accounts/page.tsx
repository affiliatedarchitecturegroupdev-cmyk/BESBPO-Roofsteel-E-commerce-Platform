"use client";

import { useState, useEffect } from "react";

// Admin trade account review — lists pending applications with approve/reject controls.
// Approve calls POST /v1/admin/trade-accounts/:id/approve (single transaction: sets
// application to APPROVED and account.type to TRADE). Reject requires a reason, which the
// customer sees on their /account/trade-account page.
export default function AdminTradeAccountsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  async function loadApplications() {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
    const token = localStorage.getItem("roofsteel_access_token");
    try {
      const res = await fetch(`${apiUrl}/admin/trade-accounts/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load applications");
      setApplications(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function handleApprove(id: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
    const token = localStorage.getItem("roofsteel_access_token");
    try {
      await fetch(`${apiUrl}/admin/trade-accounts/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadApplications();
    } catch {
      setError("Failed to approve application");
    }
  }

  async function handleReject(id: string) {
    if (!rejectionReason.trim()) {
      setError("A rejection reason is required");
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
    const token = localStorage.getItem("roofsteel_access_token");
    try {
      await fetch(`${apiUrl}/admin/trade-accounts/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rejectionReason }),
      });
      setRejecting(null);
      setRejectionReason("");
      await loadApplications();
    } catch {
      setError("Failed to reject application");
    }
  }

  if (loading) return <p style={{ color: "#7C8892" }}>Loading…</p>;

  return (
    <div>
      <h1>Trade Account Applications</h1>

      {error && <p style={{ color: "#E8631C", marginTop: 16 }}>{error}</p>}

      {applications.length === 0 ? (
        <p style={{ color: "#7C8892", marginTop: 16 }}>No pending applications.</p>
      ) : (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {applications.map((app: any) => (
            <div key={app.id} style={{ padding: 20, background: "#F2F1ED", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 16 }}>{app.companyName}</p>
                  <p style={{ fontSize: 14, color: "#7C8892", marginTop: 4 }}>
                    {app.account?.name} · {app.account?.email}
                  </p>
                  {app.registrationNo && (
                    <p style={{ fontSize: 13, color: "#7C8892" }}>Reg: {app.registrationNo}</p>
                  )}
                  <p style={{ fontSize: 13, color: "#7C8892" }}>
                    Applied: {new Date(app.createdAt).toLocaleDateString("en-ZA")}
                  </p>
                </div>
                {rejecting === app.id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 250 }}>
                    <textarea
                      placeholder="Reason for rejection (required)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="form-input"
                      rows={3}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleReject(app.id)} className="btn btn-primary" style={{ fontSize: 13 }}>
                        Confirm Reject
                      </button>
                      <button onClick={() => { setRejecting(null); setRejectionReason(""); }} className="btn btn-outline-dark" style={{ fontSize: 13 }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleApprove(app.id)} className="btn btn-primary" style={{ fontSize: 13 }}>
                      Approve
                    </button>
                    <button onClick={() => setRejecting(app.id)} className="btn btn-outline-dark" style={{ fontSize: 13 }}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
