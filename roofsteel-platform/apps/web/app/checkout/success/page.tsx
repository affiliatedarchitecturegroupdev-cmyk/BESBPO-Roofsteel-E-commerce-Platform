"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ordersApi } from "../../lib/api-client";

// Order confirmation page — shown after a successful checkout redirect. Fetches the order
// by the orderNumber query param (GET /v1/orders/:orderNumber is real) and displays a
// confirmation summary. The payment gateway redirects here with the order reference.
export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "";
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }
    ordersApi
      .getByOrderNumber(orderNumber)
      .then((data) => setOrder(data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 600 }}>
      <h1>Order Confirmed</h1>

      {!orderNumber ? (
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
          No order reference found. If you just placed an order, check your email for confirmation.
        </p>
      ) : loading ? (
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>Loading order details…</p>
      ) : !order ? (
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
          We couldn&apos;t find order {orderNumber}. If you just placed it, it may still be processing.
        </p>
      ) : (
        <div style={{ marginTop: 24, padding: 24, border: "1px solid var(--steel-light)", borderRadius: 8, background: "var(--off-white)" }}>
          <p style={{ fontSize: 20, fontWeight: 600, color: "var(--success)", marginBottom: 16 }}>
            ✓ Thank you for your order!
          </p>
          <p style={{ fontSize: 14, color: "var(--steel)" }}>Order number</p>
          <p style={{ fontWeight: 600, fontSize: 18 }}>{order.orderNumber ?? orderNumber}</p>
          <p style={{ fontSize: 14, color: "var(--steel)", marginTop: 16 }}>
            We&apos;ve sent a confirmation to your email. You can track your order status from your account.
          </p>
          <Link href="/account/orders" className="btn btn-primary" style={{ marginTop: 16 }}>
            View Order History
          </Link>
        </div>
      )}

      <Link href="/" style={{ display: "inline-block", marginTop: 24, fontSize: 14, color: "var(--steel)" }}>
        Continue Shopping
      </Link>
    </div>
  );
}
