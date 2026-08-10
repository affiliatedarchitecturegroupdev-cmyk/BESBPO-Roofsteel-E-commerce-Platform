"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ordersApi } from "../../../../lib/api-client";

// Order detail — line items with product info, order status, totals, and a status timeline.
// Fetches GET /v1/orders/:orderNumber (already real). The status timeline shows the order's
// progression through the fulfilment lifecycle (guidelines/11-order-lifecycle.md).
const STATUS_STEPS = ["PENDING_PAYMENT", "PROCESSING", "READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED"];

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting Payment",
  PROCESSING: "Processing",
  READY_FOR_DISPATCH: "Ready for Dispatch",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function OrderDetailPage({ params }: { params: { orderNumber: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await ordersApi.getByOrderNumber(params.orderNumber);
        setOrder(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.orderNumber]);

  if (loading) return <div className="container" style={{ padding: 32 }}><p style={{ color: "var(--steel)" }}>Loading…</p></div>;
  if (error) return <div className="container" style={{ padding: 32 }}><div className="form-error" role="alert">{error}</div></div>;
  if (!order) return null;

  const isCancelled = order.status === "CANCELLED";
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Order {order.orderNumber}</h1>
          <p style={{ fontSize: 13, color: "var(--steel)" }}>
            Placed on {new Date(order.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/account/orders" style={{ fontSize: 14, color: "var(--steel)" }}>← Back to Orders</Link>
      </div>

      {/* Status timeline */}
      {!isCancelled && (
        <div className="order-timeline" style={{ display: "flex", gap: 0, marginTop: 24, marginBottom: 32 }}>
          {STATUS_STEPS.map((step, i) => (
            <div key={step} style={{ flex: 1, textAlign: "center", position: "relative" }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: "50%", margin: "0 auto 8px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600,
                  background: i <= currentStepIndex ? "var(--orange)" : "var(--steel-light)",
                  color: i <= currentStepIndex ? "#fff" : "var(--steel)",
                }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: 11, color: i <= currentStepIndex ? "var(--slate)" : "var(--steel)" }}>
                {STATUS_LABELS[step]}
              </span>
            </div>
          ))}
        </div>
      )}

      {isCancelled && (
        <div className="form-error" role="status" style={{ marginTop: 24, marginBottom: 24 }}>
          This order was cancelled.
        </div>
      )}

      {/* Line items */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Items</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(order.items ?? []).map((item: any) => (
            <div key={item.id} style={{ display: "flex", gap: 12, padding: 16, border: "1px solid var(--line)", borderRadius: 8 }}>
              <Link href={`/products/${item.product?.slug ?? ""}`} className="cart-line-img" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Link href={`/products/${item.product?.slug ?? ""}`} style={{ fontWeight: 600, fontSize: 14, color: "var(--slate)" }}>
                  {item.product?.name ?? "Product"}
                </Link>
                <p style={{ fontSize: 13, color: "var(--steel)", marginTop: 4 }}>Qty: {item.quantity}</p>
                {item.madeToLengthConfig && (
                  <p style={{ fontSize: 12, color: "var(--steel)", marginTop: 4 }}>
                    Made-to-Length: {JSON.stringify(item.madeToLengthConfig)}
                  </p>
                )}
              </div>
              <span style={{ fontWeight: 600, fontSize: 14, alignSelf: "center" }}>
                R {Number(item.lineTotal).toLocaleString("en-ZA")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Totals */}
      <section style={{ marginTop: 24, padding: 16, border: "1px solid var(--line)", borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
          <span style={{ color: "var(--steel)" }}>Subtotal</span>
          <span>R {Number(order.subtotal ?? 0).toLocaleString("en-ZA")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
          <span style={{ color: "var(--steel)" }}>Delivery</span>
          <span>R {Number(order.deliveryCost ?? 0).toLocaleString("en-ZA")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 600, borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 8 }}>
          <span>Total</span>
          <span>R {Number(order.total).toLocaleString("en-ZA")}</span>
        </div>
      </section>

      {order.estimatedReadyDays && (
        <p style={{ fontSize: 13, color: "var(--steel)", marginTop: 16 }}>
          Estimated ready in {order.estimatedReadyDays} day{order.estimatedReadyDays > 1 ? "s" : ""}.
        </p>
      )}
    </div>
  );
}
