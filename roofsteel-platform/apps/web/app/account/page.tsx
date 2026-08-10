// SCAFFOLD — Phase 2/3 (guidelines/12-storefront-ux-and-ia.md's Account section).
// Dashboard: recent orders, trade account status badge, quick links to the sub-pages
// below. Needs the auth session (Phase 2, see Gap Analysis I Section 7) before this can
// show real account-specific data.
export default function AccountDashboardPage() {
  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <h1>My Account</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
        This page is scaffolded, not yet built — see the TODO comment above this component.
      </p>
    </div>
  );
}
