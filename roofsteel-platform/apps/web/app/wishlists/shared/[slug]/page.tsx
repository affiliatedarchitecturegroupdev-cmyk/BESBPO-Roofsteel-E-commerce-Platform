"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { wishlistsApi } from "../../../../lib/api-client";

// Public shared wishlist — accessible without auth via the shareSlug (the backend route
// GET /wishlists/shared/:slug has no JwtAuthGuard). Read-only: no remove/edit controls.
export default function SharedWishlistPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [wishlist, setWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await wishlistsApi.getByShareSlug(slug);
        setWishlist(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Wishlist not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <div className="container" style={{ padding: 32 }}><p style={{ color: "var(--steel)" }}>Loading…</p></div>;
  if (error) return <div className="container" style={{ padding: 32 }}><div className="form-error" role="alert">{error}</div></div>;
  if (!wishlist) return null;

  const items = wishlist.items ?? [];

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 700 }}>
      <h1>{wishlist.name}</h1>
      <p style={{ fontSize: 13, color: "var(--steel)" }}>
        Shared wishlist · {items.length} items
      </p>

      {items.length === 0 ? (
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 24 }}>This wishlist has no items.</p>
      ) : (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item: any) => (
            <div key={item.id} style={{ display: "flex", gap: 12, padding: 16, border: "1px solid var(--line)", borderRadius: 8 }}>
              <Link href={`/products/${item.product.slug}`} className="cart-line-img" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Link href={`/products/${item.product.slug}`} style={{ fontWeight: 600, fontSize: 14, color: "var(--slate)" }}>
                  {item.product.name}
                </Link>
                <p style={{ fontSize: 12, color: "var(--steel)", marginTop: 4 }}>
                  {item.product.category?.name ?? "Uncategorised"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
