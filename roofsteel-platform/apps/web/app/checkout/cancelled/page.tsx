// SCAFFOLD — Phase 3. Shown when a payment gateway redirect returns a cancelled/failed
// status. Should offer a clear retry path back to /checkout, not just a dead end.
export default function CheckoutCancelledPage() {
  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <h1>Payment Cancelled</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
        This page is scaffolded, not yet built — see the TODO comment above this component.
      </p>
    </div>
  );
}
