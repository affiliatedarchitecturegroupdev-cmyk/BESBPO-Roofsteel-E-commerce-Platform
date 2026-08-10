"use client";

import Link from "next/link";
import { useAuth } from "../../lib/hooks";

// Account dashboard — shows the authenticated user's name, email, and account type, with
// quick links to orders, addresses, wishlists, and trade account application. If not
// authenticated, shows a login/register CTA instead. The auth state comes from useAuth()
// in lib/hooks.ts, which reads the JWT from localStorage.
export default function AccountDashboardPage() {
  const { auth, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="container" style={{ padding: "32px 16px" }}>
        <h1>My Account</h1>
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>Loading…</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="container" style={{ padding: "32px 16px", maxWidth: 480 }}>
        <h1>My Account</h1>
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8, marginBottom: 24 }}>
          Log in to see your orders, saved lists, and trade pricing.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login?returnTo=/account" className="btn btn-primary">
            Log In
          </Link>
          <Link href="/register?returnTo=/account" className="btn btn-outline-dark">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>My Account</h1>
        <button
          onClick={logout}
          className="btn btn-outline-dark"
          style={{ fontSize: 14 }}
        >
          Log Out
        </button>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: 24,
          background: "var(--off-white)",
          borderRadius: 8,
        }}
      >
        <p style={{ fontSize: 18, fontWeight: 600 }}>{auth.name ?? "Account holder"}</p>
        <p style={{ fontSize: 14, color: "var(--steel)" }}>{auth.email}</p>
        {auth.type && auth.type !== "RETAIL" && (
          <span
            style={{
              display: "inline-block",
              marginTop: 8,
              padding: "4px 12px",
              background: "var(--orange)",
              color: "white",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {auth.type} Account
          </span>
        )}
      </div>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <Link
          href="/account/orders"
          className="account-link-card"
          style={{ padding: 20, border: "1px solid var(--steel-light)", borderRadius: 8 }}
        >
          <h3 style={{ fontSize: 16 }}>Orders</h3>
          <p style={{ fontSize: 13, color: "var(--steel)", marginTop: 4 }}>
            View your order history and track deliveries.
          </p>
        </Link>

        <Link
          href="/account/addresses"
          className="account-link-card"
          style={{ padding: 20, border: "1px solid var(--steel-light)", borderRadius: 8 }}
        >
          <h3 style={{ fontSize: 16 }}>Addresses</h3>
          <p style={{ fontSize: 13, color: "var(--steel)", marginTop: 4 }}>
            Manage delivery and billing addresses.
          </p>
        </Link>

        <Link
          href="/account/wishlists"
          className="account-link-card"
          style={{ padding: 20, border: "1px solid var(--steel-light)", borderRadius: 8 }}
        >
          <h3 style={{ fontSize: 16 }}>Wishlists</h3>
          <p style={{ fontSize: 13, color: "var(--steel)", marginTop: 4 }}>
            Your saved product lists and project boards.
          </p>
        </Link>

        <Link
          href="/account/trade-account"
          className="account-link-card"
          style={{ padding: 20, border: "1px solid var(--steel-light)", borderRadius: 8 }}
        >
          <h3 style={{ fontSize: 16 }}>Trade Account</h3>
          <p style={{ fontSize: 13, color: "var(--steel)", marginTop: 4 }}>
            Apply for trade pricing or check your application status.
          </p>
        </Link>

        <Link
          href="/account/settings"
          className="account-link-card"
          style={{ padding: 20, border: "1px solid var(--steel-light)", borderRadius: 8 }}
        >
          <h3 style={{ fontSize: 16 }}>Settings</h3>
          <p style={{ fontSize: 13, color: "var(--steel)", marginTop: 4 }}>
            Update your profile and change your password.
          </p>
        </Link>
      </div>
    </div>
  );
}
