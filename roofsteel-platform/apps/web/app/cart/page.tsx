// SCAFFOLD — Phase 3 (guidelines/12-storefront-ux-and-ia.md's Cart section).
// The CartDrawer component (components/cart/CartDrawer.tsx) is real — this page renders
// the same content full-page rather than as a drawer overlay. Needs real cart state
// (GET /v1/cart) instead of the drawer's current standalone prop-driven usage.
export default function CartPage() {
  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <h1>Your Cart</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
        This page is scaffolded, not yet built — see the TODO comment above this component.
      </p>
    </div>
  );
}
