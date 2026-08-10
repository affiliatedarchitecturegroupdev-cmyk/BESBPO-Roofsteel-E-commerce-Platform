// SCAFFOLD — Phase 2 (guidelines/12-storefront-ux-and-ia.md).
// Same grid/filter UI as the category page — reuse those components once built,
// don't duplicate. Needs real Postgres full-text search on the API side first
// (products.module.ts currently has a `contains` placeholder, see Gap Analysis I Section 8).
export default function SearchPage() {
  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <h1>Search</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
        This page is scaffolded, not yet built — see the TODO comment above this component.
      </p>
    </div>
  );
}
