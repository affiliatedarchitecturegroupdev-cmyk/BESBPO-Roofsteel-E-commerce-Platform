"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Admin panel layout — sidebar nav with the four admin sections. The admin API routes are
// /v1/admin/* and require AdminGuard (role: ADMIN). If a non-admin user visits /admin, the
// API calls will 403 and the pages show an access-denied message.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/trade-accounts", label: "Trade Accounts" },
    { href: "/admin/products", label: "Products" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          background: "#1A1F24",
          color: "#F2F1ED",
          padding: "24px 0",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #2D3440" }}>
          <Link href="/admin" style={{ color: "#E8631C", fontWeight: 700, fontSize: 18 }}>
            ROOFSTEEL
          </Link>
          <p style={{ fontSize: 12, color: "#7C8892", marginTop: 4 }}>Admin Panel</p>
        </div>
        <nav style={{ padding: "16px 0" }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "10px 20px",
                color: pathname === item.href ? "#E8631C" : "#F2F1ED",
                textDecoration: "none",
                fontSize: 14,
                background: pathname === item.href ? "#2D3440" : "transparent",
                borderLeft: pathname === item.href ? "3px solid #E8631C" : "3px solid transparent",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: "20px", borderTop: "1px solid #2D3440", marginTop: "auto" }}>
          <Link href="/" style={{ color: "#7C8892", fontSize: 13, textDecoration: "none" }}>
            ← Back to Store
          </Link>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "32px" }}>{children}</main>
    </div>
  );
}
