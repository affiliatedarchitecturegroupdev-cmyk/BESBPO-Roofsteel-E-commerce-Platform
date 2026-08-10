"use client";

import Link from "next/link";
import { useCart } from "../../lib/hooks";
import { PriceDisplay } from "../../components/product/PriceDisplay";

// Cart page — reads from the CartContext (lib/hooks.ts), which fetches GET /v1/cart and
// exposes addToCart/updateQuantity/removeItem. The same context feeds the header badge
// and cart drawer, so this page and those always agree on cart state. Empty cart shows
// a CTA to continue shopping, not a blank page.
export default function CartPage() {
  const { cart, loading, updateQuantity, removeItem } = useCart();

  if (loading) {
    return (
      <div className="container" style={{ padding: "32px 16px" }}>
        <h1>Your Cart</h1>
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>Loading…</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: "32px 16px" }}>
        <h1>Your Cart</h1>
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8, marginBottom: 24 }}>
          Your cart is empty.
        </p>
        <Link href="/" className="btn btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <h1>Your Cart</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
        {cart.items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              gap: 16,
              padding: 16,
              border: "1px solid var(--steel-light)",
              borderRadius: 8,
            }}
          >
            <div style={{ flex: 1 }}>
              <Link
                href={`/products/${item.productName.toLowerCase().replace(/\s+/g, "-")}`}
                style={{ fontWeight: 600, color: "var(--slate)" }}
              >
                {item.productName}
              </Link>
              <p style={{ fontSize: 13, color: "var(--steel)", marginTop: 4 }}>
                {item.product.unit} · {item.product.fulfilmentType.replace(/_/g, " ").toLowerCase()}
              </p>
              <PriceDisplay pricing={item.pricing} unit={item.product.unit} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="btn btn-outline-dark"
                  style={{ width: 32, padding: 0, minWidth: 32 }}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span style={{ minWidth: 32, textAlign: "center" }}>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="btn btn-outline-dark"
                  style={{ width: 32, padding: 0, minWidth: 32 }}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                style={{ fontSize: 13, color: "var(--steel)", background: "none", border: "none", cursor: "pointer" }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderTop: "2px solid var(--slate)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600 }}>Subtotal</span>
        <PriceDisplay pricing={{ ...cart.items[0]?.pricing, applicablePrice: cart.subtotal }} unit="" />
      </div>

      <Link href="/checkout" className="btn btn-primary" style={{ marginTop: 16, display: "inline-block" }}>
        Proceed to Checkout
      </Link>
    </div>
  );
}
