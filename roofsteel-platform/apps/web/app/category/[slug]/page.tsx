// SCAFFOLD — Phase 2 (guidelines/12-storefront-ux-and-ia.md, PLP section).
// Needs: breadcrumb, filter sidebar/drawer (subcategory, fulfilment type, segment),
// sort dropdown, ProductCard grid, pagination. Fetch from GET /v1/products?category=:slug.
// params.slug identifies the category once wired up.
export default function CategoryPage({ params }: { params: { slug: string } }) {
  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <h1>Category</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
        This page is scaffolded, not yet built — see the TODO comment above this component.
      </p>
    </div>
  );
}
