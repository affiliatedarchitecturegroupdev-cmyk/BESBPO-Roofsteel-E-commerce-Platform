"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { wishlistsApi } from "../../../lib/api-client";

// Wishlist detail — shows all items in a named wishlist, with remove-item controls, visibility
// toggle (private/public), delete-wishlist, and "add all to cart" (a future enhancement). The
// share link is shown when the list is public (guidelines/12-storefront-ux-and-ia.md Section 3.7).
export default function WishlistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [wishlist, setWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await wishlistsApi.getById(id);
      setWishlist(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleRemoveItem(itemId: string) {
    try {
      await wishlistsApi.removeItem(id, itemId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove item");
    }
  }

  async function handleToggleVisibility() {
    if (!wishlist) return;
    try {
      await wishlistsApi.updateVisibility(id, !wishlist.isPublic);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update visibility");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${wishlist.name}"? This cannot be undone.`)) return;
    try {
      await wishlistsApi.delete(id);
      router.push("/account/wishlists");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete wishlist");
    }
  }

  if (loading) return <div className="container" style={{ padding: 32 }}><p style={{ color: "var(--steel)" }}>Loading…</p></div>;
  if (error) return <div className="container" style={{ padding: 32 }}><div className="form-error" role="alert">{error}</div></div>;
  if (!wishlist) return null;

  const items = wishlist.items ?? [];

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>{wishlist.name}</h1>
          <p style={{ fontSize: 13, color: "var(--steel)" }}>
            {items.length} items · {wishlist.isPublic ? "Public" : "Private"}
          </p>
        </div>
        <Link href="/account/wishlists" style={{ fontSize: 14, color: "var(--steel)" }}>← Back to Wishlists</Link>
      </div>

      {wishlist.isPublic && wishlist.shareSlug && (
        <div style={{ marginTop: 12, padding: 12, background: "var(--bg-alt)", borderRadius: 8, fontSize: 13 }}>
          <span style={{ color: "var(--steel)" }}>Share link: </span>
          <Link href={`/wishlists/shared/${wishlist.shareSlug}`} style={{ color: "var(--orange)" }}>
            /wishlists/shared/{wishlist.shareSlug}
          </Link>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={handleToggleVisibility} className="btn btn-outline-dark" style={{ fontSize: 13 }}>
          Make {wishlist.isPublic ? "Private" : "Public"}
        </button>
        <button onClick={handleDelete} className="btn btn-outline-dark" style={{ fontSize: 13, color: "var(--danger, #c0392b)" }}>
          Delete Wishlist
        </button>
      </div>

      {items.length === 0 ? (
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 24 }}>
          No items in this wishlist yet. Browse the{" "}
          <Link href="/products" style={{ color: "var(--orange)" }}>catalogue</Link> and add products.
        </p>
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
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="btn btn-outline-dark"
                style={{ fontSize: 12, padding: "6px 12px", alignSelf: "center" }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
