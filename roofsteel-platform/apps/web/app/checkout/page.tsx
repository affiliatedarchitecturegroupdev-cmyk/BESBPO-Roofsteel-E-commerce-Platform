// SCAFFOLD — Phase 3 (guidelines/12-storefront-ux-and-ia.md's Checkout section).
// One page, collapsible steps: Delivery Address -> Delivery/Freight -> Payment -> Review.
// Payment method list must be tier-filtered using GATEWAYS_BY_TIER, already real in
// apps/api/src/orders/payments/payment-strategy.interface.ts — fetch the account's tier
// server-side, never trust a client-selected gateway without server-side revalidation.
export default function CheckoutPage() {
  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <h1>Checkout</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
        This page is scaffolded, not yet built — see the TODO comment above this component.
      </p>
    </div>
  );
}
