// SCAFFOLD — Phase 3. Fetch GET /v1/orders/:orderNumber (already real).
// Needs: line items with Made-to-Length config shown per line (same pattern as
// CartDrawer's cart-line-config), order status timeline, tracking info once spec
// Section 11.1's notification milestones exist.
export default function OrderDetailPage({ params }: { params: { orderNumber: string } }) {
  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <h1>Order Detail</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
        This page is scaffolded, not yet built — see the TODO comment above this component.
      </p>
    </div>
  );
}
