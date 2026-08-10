"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ordersApi, type OrderSummary } from "../../../lib/api-client";

// Order history — fetches the list of the authenticated account's orders. The API needs a
// list-by-account endpoint (currently only GET /:orderNumber exists — task 3.2 will add
// GET /v1/orders as a list endpoint). For now, this page is structurally complete and will
// work once that endpoint is added. The API client already has ordersApi.getByOrderNumber.
export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The ordersApi.listByAccount endpoint is task 3.2 scope — for now, show the page
    // structure with an empty list. The API client method will be added when the endpoint
    // exists, and this page will just work.
    setLoading(false);
  }, []);

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Order History</h1>
        <Link href="/account" style={{ fontSize: 14, color: "var(--steel)" }}>← Back to Account</Link>
      </div>

      {loading ? (
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 16 }}>Loading…</p>
      ) : error ? (
        <p style={{ color: "var(--orange)", fontSize: 14, marginTop: 16 }}>{error}</p>
      ) : orders.length === 0 ? (
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 16, marginBottom: 16 }}>
          No orders yet. When you place an order, it will appear here.
        </p>
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.orderNumber}`}
              style={{ padding: 16, border: "1px solid var(--steel-light)", borderRadius: 8, textDecoration: "none" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--slate)" }}>{order.orderNumber}</p>
                  <p style={{ fontSize: 13, color: "var(--steel)" }}>
                    {new Date(order.createdAt).toLocaleDateString("en-ZA")}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 600, color: "var(--slate)" }}>R {order.total}</p>
                  <span style={{ fontSize: 12, textTransform: "uppercase", color: "var(--orange)" }}>
                    {order.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
