"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../Icon";

export interface MobileTabBarProps {
  cartCount?: number;
}

// Persistent bottom tab bar — mobile only (hidden >=1080px via .tab-bar rule
// in globals.css). See guidelines/12-storefront-ux-and-ia.md for why this
// exists as a deliberate deviation from the corporate site's simpler
// hamburger nav: the store is revisited constantly mid-session, the
// corporate site is browsed linearly.
const TABS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/categories", label: "Categories", icon: "grid" },
  { href: "/search", label: "Search", icon: "compass" },
  { href: "/cart", label: "Cart", icon: "bag" },
  { href: "/account", label: "Account", icon: "users" },
] as const;

export function MobileTabBar({ cartCount = 0 }: MobileTabBarProps) {
  const pathname = usePathname();

  return (
    <nav className="tab-bar" aria-label="Primary">
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className={`tab-item${active ? " active" : ""}`}>
            <Icon name={tab.icon} size={20} />
            <span>{tab.label}</span>
            {tab.href === "/cart" && cartCount > 0 && <span className="tab-badge">{cartCount}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
