"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../lib/hooks";
import { addressesApi, type AddressDto } from "../../lib/api-client";

// Checkout — one page, collapsible steps: Delivery Address → Delivery/Freight → Payment →
// Review (guidelines/12-storefront-ux-and-ia.md's Checkout section). Payment gateway list
// is tier-filtered server-side (orders.service.ts validates the gateway against the
// account type); this page just presents the options and sends the selection, which the
// server re-validates — never trust a client-selected gateway without server-side checks.
//
// For an unauthenticated (guest) checkout, the address form collects a one-off delivery
// address; for an authenticated user, saved addresses are listed and selectable.
export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading: cartLoading } = useCart();
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [fulfilmentType, setFulfilmentType] = useState<"DELIVERY" | "COLLECTION">("DELIVERY");
  const [paymentGateway, setPaymentGateway] = useState<string>("payfast");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestAddress, setGuestAddress] = useState({ line1: "", city: "", postalCode: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to load saved addresses — if the user is authenticated, this succeeds; if not,
    // it 401s silently and the guest address form is shown instead.
    addressesApi.list().then(setAddresses).catch(() => {});
  }, []);

  async function handlePlaceOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
      const token = localStorage.getItem("roofsteel_access_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          cartId: cart?.id,
          fulfilmentType,
          paymentGateway,
          guestEmail: token ? undefined : guestEmail,
          deliveryAddressId: token ? selectedAddressId : undefined,
          guestDeliveryAddress: token ? undefined : guestAddress,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message ?? `Order failed: ${res.status}`);
      }

      const order = await res.json();
      router.push(`/checkout/success?order=${order.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (cartLoading) {
    return (
      <div className="container" style={{ padding: "32px 16px" }}>
        <h1>Checkout</h1>
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>Loading…</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: "32px 16px" }}>
        <h1>Checkout</h1>
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8, marginBottom: 24 }}>
          Your cart is empty.
        </p>
        <Link href="/" className="btn btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  const isAuthenticated = !!localStorage.getItem("roofsteel_access_token");

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 800 }}>
      <h1>Checkout</h1>

      {/* Order summary */}
      <div style={{ marginTop: 24, padding: 16, border: "1px solid var(--steel-light)", borderRadius: 8 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Order Summary</h2>
        {cart.items.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}>
            <span>{item.productName} × {item.quantity}</span>
            <span>R {item.lineTotal.toFixed(2)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid var(--steel-light)", marginTop: 8, paddingTop: 8, fontWeight: 600 }}>
          Subtotal: R {cart.subtotal.toFixed(2)}
        </div>
      </div>

      {/* Step 1: Delivery address */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>1. Delivery Address</h2>
        {isAuthenticated && addresses.length > 0 ? (
          <div>
            {addresses.map((addr) => (
              <label key={addr.id} style={{ display: "block", padding: 12, border: selectedAddressId === addr.id ? "2px solid var(--orange)" : "1px solid var(--steel-light)", borderRadius: 8, marginBottom: 8, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={selectedAddressId === addr.id}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                {addr.line1}, {addr.city}, {addr.province} {addr.postalCode}
                {addr.isDefault && <span style={{ fontSize: 12, color: "var(--orange)", marginLeft: 8 }}>Default</span>}
              </label>
            ))}
            <Link href="/account/addresses" style={{ fontSize: 13, color: "var(--orange)" }}>Add a new address</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {!isAuthenticated && (
              <input
                type="email"
                placeholder="Email for order confirmation"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="form-input"
                required
              />
            )}
            <input
              type="text"
              placeholder="Street address"
              value={guestAddress.line1}
              onChange={(e) => setGuestAddress({ ...guestAddress, line1: e.target.value })}
              className="form-input"
            />
            <div style={{ display: "flex", gap: 12 }}>
              <input
                type="text"
                placeholder="City"
                value={guestAddress.city}
                onChange={(e) => setGuestAddress({ ...guestAddress, city: e.target.value })}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Postal code"
                value={guestAddress.postalCode}
                onChange={(e) => setGuestAddress({ ...guestAddress, postalCode: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Fulfilment method */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>2. Delivery or Collection</h2>
        <label style={{ display: "block", padding: 12, border: fulfilmentType === "DELIVERY" ? "2px solid var(--orange)" : "1px solid var(--steel-light)", borderRadius: 8, marginBottom: 8, cursor: "pointer" }}>
          <input
            type="radio"
            name="fulfilment"
            value="DELIVERY"
            checked={fulfilmentType === "DELIVERY"}
            onChange={() => setFulfilmentType("DELIVERY")}
            style={{ marginRight: 8 }}
          />
          Delivery — calculated by weight and distance
        </label>
        <label style={{ display: "block", padding: 12, border: fulfilmentType === "COLLECTION" ? "2px solid var(--orange)" : "1px solid var(--steel-light)", borderRadius: 8, cursor: "pointer" }}>
          <input
            type="radio"
            name="fulfilment"
            value="COLLECTION"
            checked={fulfilmentType === "COLLECTION"}
            onChange={() => setFulfilmentType("COLLECTION")}
            style={{ marginRight: 8 }}
          />
          Collection — pick up from a Roofsteel branch
        </label>
      </div>

      {/* Step 3: Payment method */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>3. Payment Method</h2>
        <label style={{ display: "block", padding: 12, border: paymentGateway === "payfast" ? "2px solid var(--orange)" : "1px solid var(--steel-light)", borderRadius: 8, marginBottom: 8, cursor: "pointer" }}>
          <input type="radio" name="payment" value="payfast" checked={paymentGateway === "payfast"} onChange={() => setPaymentGateway("payfast")} style={{ marginRight: 8 }} />
          PayFast — card, EFT, or instant EFT
        </label>
        <label style={{ display: "block", padding: 12, border: paymentGateway === "lulapay" ? "2px solid var(--orange)" : "1px solid var(--steel-light)", borderRadius: 8, marginBottom: 8, cursor: "pointer" }}>
          <input type="radio" name="payment" value="lulapay" checked={paymentGateway === "lulapay"} onChange={() => setPaymentGateway("lulapay")} style={{ marginRight: 8 }} />
          Lulapay — pay later (trade accounts)
        </label>
        <label style={{ display: "block", padding: 12, border: paymentGateway === "payjustnow" ? "2px solid var(--orange)" : "1px solid var(--steel-light)", borderRadius: 8, cursor: "pointer" }}>
          <input type="radio" name="payment" value="payjustnow" checked={paymentGateway === "payjustnow"} onChange={() => setPaymentGateway("payjustnow")} style={{ marginRight: 8 }} />
          PayJustNow — 3 interest-free instalments
        </label>
      </div>

      {error && (
        <div className="form-error" role="alert" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      {/* Place order */}
      <button
        onClick={handlePlaceOrder}
        disabled={submitting}
        className="btn btn-primary"
        style={{ marginTop: 24, width: "100%", padding: "12px 0" }}
      >
        {submitting ? "Placing order…" : `Place Order — R ${cart.subtotal.toFixed(2)}`}
      </button>
    </div>
  );
}
