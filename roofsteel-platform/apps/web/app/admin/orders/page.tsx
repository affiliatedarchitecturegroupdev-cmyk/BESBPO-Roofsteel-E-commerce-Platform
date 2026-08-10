"use client";

import { useState, useEffect } from "react";

const ORDER_STATUSES = ["PENDING", "PROCESSING", "PACKED", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

// Admin orders management — list all orders with status filter, and status transition
// controls. Each transition calls PATCH /v1/admin/orders/:id/status. The status flow is
// PENDING → PROCESSING → PACKED → DISPATCHED → OUT_FOR_DELIVERY → DELIVERED (spec Section
// 3.6). An admin can also cancel an order.
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  async function loadOrders() {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
    const token = localStorage.getItem("roofsteel_access_token");
    const query = statusFilter ? `?status=${statusFilter}` : "";
    try {
      const res = await fetch(`${apiUrl}/admin/orders${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  async function handleStatusChange(orderId: string, status: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
    const token = localStorage.getItem("roofsteel_access_token");
    try {
      await fetch(`${apiUrl}/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      await loadOrders();
    } catch (e) {
      setError("Failed to update order status");
    }
  }

  if (loading) return <p style={{ color: "#7C8892" }}>Loading…</p>;

  return (
    <div>
      <h1>Orders</h1>

      {error && <p style={{ color: "#E8631C", marginTop: 16 }}>{error}</p>}

      <div style={{ marginTop: 16, marginBottom: 24 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input"
          style={{ width: 200 }}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {orders.length === 0 ? (
        <p style={{ color: "#7C8892" }}>No orders found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #1A1F24", textAlign: "left" }}>
              <th style={{ padding: "8px 0" }}>Order #</th>
              <th style={{ padding: "8px 0" }}>Customer</th>
              <th style={{ padding: "8px 0" }}>Date</th>
              <th style={{ padding: "8px 0", textAlign: "right" }}>Total</th>
              <th style={{ padding: "8px 0" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr key={order.id} style={{ borderBottom: "1px solid #D5D9DD" }}>
                <td style={{ padding: "8px 0" }}>{order.orderNumber}</td>
                <td style={{ padding: "8px 0" }}>{order.account?.name ?? order.guestEmail ?? "—"}</td>
                <td style={{ padding: "8px 0" }}>{new Date(order.createdAt).toLocaleDateString("en-ZA")}</td>
                <td style={{ padding: "8px 0", textAlign: "right" }}>R {order.total?.toFixed(2)}</td>
                <td style={{ padding: "8px 0" }}>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="form-input"
                    style={{ width: "auto", fontSize: 12, padding: "4px 8px" }}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
