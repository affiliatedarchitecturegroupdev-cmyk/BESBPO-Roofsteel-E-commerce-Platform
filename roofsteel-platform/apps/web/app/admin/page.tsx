"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Admin dashboard — shows counts of pending trade applications and recent orders as quick
// links. Each card links to the relevant admin section. The API calls go to /v1/admin/*
// (AdminGuard-protected); if the user isn't an admin, they'll see error messages.
export default function AdminDashboardPage() {
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
    const token = localStorage.getItem("roofsteel_access_token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${apiUrl}/admin/trade-accounts/pending`, { headers }).then((r) => r.ok ? r.json() : []),
      fetch(`${apiUrl}/admin/orders?pageSize=5`, { headers }).then((r) => r.ok ? r.json() : { items: [] }),
    ])
      .then(([pending, orders]) => {
        setPendingCount(Array.isArray(pending) ? pending.length : 0);
        setRecentOrders(orders.items ?? []);
      })
      .catch(() => setError("Failed to load admin data — make sure you're logged in as an admin."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "#7C8892" }}>Loading…</p>;

  if (error) {
    return (
      <div>
        <h1>Admin Dashboard</h1>
        <p style={{ color: "#E8631C", marginTop: 16 }}>{error}</p>
        <Link href="/login?returnTo=/admin" style={{ color: "#E8631C", marginTop: 16, display: "inline-block" }}>
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginTop: 24 }}>
        <Link
          href="/admin/trade-accounts"
          style={{ padding: 20, background: "#F2F1ED", borderRadius: 8, textDecoration: "none" }}
        >
          <p style={{ fontSize: 32, fontWeight: 700, color: "#1A1F24" }}>{pendingCount ?? 0}</p>
          <p style={{ fontSize: 14, color: "#7C8892" }}>Pending Trade Applications</p>
        </Link>

        <Link
          href="/admin/orders"
          style={{ padding: 20, background: "#F2F1ED", borderRadius: 8, textDecoration: "none" }}
        >
          <p style={{ fontSize: 32, fontWeight: 700, color: "#1A1F24" }}>{recentOrders.length}</p>
          <p style={{ fontSize: 14, color: "#7C8892" }}>Recent Orders</p>
        </Link>
      </div>

      {recentOrders.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Recent Orders</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #1A1F24", textAlign: "left" }}>
                <th style={{ padding: "8px 0" }}>Order #</th>
                <th style={{ padding: "8px 0" }}>Customer</th>
                <th style={{ padding: "8px 0" }}>Status</th>
                <th style={{ padding: "8px 0", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: any) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #D5D9DD" }}>
                  <td style={{ padding: "8px 0" }}>{order.orderNumber}</td>
                  <td style={{ padding: "8px 0" }}>{order.account?.name ?? order.guestEmail}</td>
                  <td style={{ padding: "8px 0" }}>
                    <span style={{ textTransform: "uppercase", fontSize: 12, fontWeight: 600 }}>{order.status}</span>
                  </td>
                  <td style={{ padding: "8px 0", textAlign: "right" }}>R {order.total?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
