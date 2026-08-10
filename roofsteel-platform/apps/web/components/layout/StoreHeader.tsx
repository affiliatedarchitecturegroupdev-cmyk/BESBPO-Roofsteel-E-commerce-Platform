"use client";

import Link from "next/link";
import { Icon } from "../Icon";
import { useCart } from "../../lib/hooks";

// Validated against design-mockup/mockup.html's mobile and desktop Home
// screens (docs/DEVELOPMENT-LOG.md) — one component, responsive via CSS
// (.dnav / .dsearch hidden below 1080px in globals.css), not two separate
// components, matching the corporate site's own pattern of hiding
// desktop-only nav via CSS rather than conditional rendering.
//
// Deliberately different from the corporate site's header
// (guidelines/12-storefront-ux-and-ia.md's "same brand, different job"):
// no Launch Store CTA (we're already in the store), cart + account icons
// take that visual priority instead. Cart count comes from the CartContext
// (lib/hooks.ts) — real, not hardcoded.
export function StoreHeader() {
  const { itemCount } = useCart();

  return (
    <header className="store-header">
      <Link href="/" className="brand" aria-label="Roofsteel home">
        <svg viewBox="0 0 100 100" width="26" height="26" aria-hidden="true">
          <path
            fillRule="evenodd"
            fill="#E8631C"
            d="M20,15 L80,15 L80,48 L54,48 L88,85 L72,85 L40,48 L36,48 L36,85 L20,85 Z M44,23 L68,23 L68,40 L44,40 Z"
          />
          <path fill="#B84A12" d="M54,48 L88,85 L78,85 L48,52 Z" />
          <g stroke="#F2F1ED" strokeWidth={2.4}>
            <line x1="20" y1="58" x2="36" y2="58" />
            <line x1="20" y1="65" x2="36" y2="65" />
            <line x1="20" y1="72" x2="36" y2="72" />
          </g>
        </svg>
        <span className="brand-word">ROOFSTEEL</span>
      </Link>

      {/* Desktop-only — hidden below 1080px via .dnav rule in globals.css,
          mirrors the corporate site's main-nav breakpoint. */}
      <nav className="dnav" aria-label="Categories">
        <Link className="dnav-link" href="/category/steel-roofing-sheets">Steel Roofing</Link>
        <Link className="dnav-link" href="/category/structural-steel">Structural</Link>
        <Link className="dnav-link" href="/category/reinforcing-steel">Reinforcing</Link>
        <Link className="dnav-link" href="/category/roofing-timber-trusses">Timber</Link>
      </nav>

      <Link href="/search" className="dsearch" aria-label="Search products">
        <Icon name="compass" size={16} color="#7C8892" />
        <span>Search products...</span>
      </Link>

      <div className="header-icons">
        <Link href="/account" aria-label="Account">
          <Icon name="users" size={20} color="#1A1F24" />
        </Link>
        <Link href="/cart" className="cart-icon-wrap" aria-label={`Cart, ${itemCount} items`}>
          <Icon name="bag" size={20} color="#1A1F24" />
          {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </Link>
      </div>
    </header>
  );
}
