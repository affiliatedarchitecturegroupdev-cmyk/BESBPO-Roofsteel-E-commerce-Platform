// SCAFFOLD — Phase 3/4. Project/Tender tier RFQ entry point (spec Section 4.3).
// No Quote/QuoteItem endpoints exist yet — see Gap Analysis I Section 2. Also the
// entry point for non-standard cut/bend shapes routed out of the standard cart
// (guidelines/04-made-to-length-configurator.md's cut/bend section).
export default function QuoteRequestPage() {
  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <h1>Request a Quote</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
        This page is scaffolded, not yet built — see the TODO comment above this component.
      </p>
    </div>
  );
}
