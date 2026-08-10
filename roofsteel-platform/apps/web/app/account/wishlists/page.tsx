"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { wishlistsApi } from "../../../lib/api-client";

// Wishlists page — multi-list, project-based (spec Section 3.7). A user can have multiple
// named lists (e.g. "Warehouse Roof Project", "Q3 Site Order"), each with its own visibility
// (private/public) and share slug. The backend (task 2.7) is real; this page calls it.
export default function WishlistsPage() {
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadWishlists() {
    setLoading(true);
    try {
      const data = await wishlistsApi.list();
      setWishlists(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wishlists");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishlists();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await wishlistsApi.create(name, isPublic);
      setShowCreate(false);
      setName("");
      setIsPublic(false);
      await loadWishlists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create wishlist");
    }
  }

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>My Wishlists</h1>
        <Link href="/account" style={{ fontSize: 14, color: "var(--steel)" }}>← Back to Account</Link>
      </div>

      {error && <div className="form-error" role="alert" style={{ marginTop: 16 }}>{error}</div>}

      {loading ? (
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 16 }}>Loading…</p>
      ) : wishlists.length === 0 ? (
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 16, marginBottom: 16 }}>
          No wishlists yet. Create one to save products for a project.
        </p>
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {wishlists.map((wl: any) => (
            <div key={wl.id} style={{ padding: 16, border: "1px solid var(--steel-light)", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--slate)" }}>{wl.name}</p>
                  <p style={{ fontSize: 13, color: "var(--steel)" }}>
                    {wl._count?.items ?? 0} items · {wl.isPublic ? "Public" : "Private"}
                  </p>
                  {wl.isPublic && wl.shareSlug && (
                    <p style={{ fontSize: 12, color: "var(--orange)", marginTop: 4 }}>
                      Share: /wishlists/shared/{wl.shareSlug}
                    </p>
                  )}
                </div>
                <Link href={`/wishlists/${wl.id}`} style={{ fontSize: 13, color: "var(--orange)" }}>
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate ? (
        <form onSubmit={handleCreate} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontSize: 18 }}>New Wishlist</h2>
          <input className="form-input" type="text" placeholder="e.g. Warehouse Roof Project" value={name} onChange={(e) => setName(e.target.value)} required />
          <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            Make this list public (generates a shareable link)
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="btn btn-primary">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn btn-outline-dark">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowCreate(true)} className="btn btn-outline-dark" style={{ marginTop: 16 }}>
          + Create New Wishlist
        </button>
      )}
    </div>
  );
}
