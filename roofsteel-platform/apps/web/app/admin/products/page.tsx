"use client";

import { useState, useEffect } from "react";

// Admin products management — list all products with search, and inline edit for the key
// fields (name, specs, active). Calls GET /v1/admin/products and PATCH /v1/admin/products/:id.
// A product's pricing band can't be bypassed from here — the pricing service always resolves
// fresh from the band, never trusts a client-sent price.
export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSpecs, setEditSpecs] = useState("");
  const [editActive, setEditActive] = useState(true);

  async function loadProducts() {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
    const token = localStorage.getItem("roofsteel_access_token");
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    try {
      const res = await fetch(`${apiUrl}/admin/products${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [search]);

  function startEdit(product: any) {
    setEditing(product.id);
    setEditName(product.name);
    setEditSpecs(product.specs ?? "");
    setEditActive(product.active);
  }

  async function saveEdit(id: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
    const token = localStorage.getItem("roofsteel_access_token");
    try {
      await fetch(`${apiUrl}/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, specs: editSpecs, active: editActive }),
      });
      setEditing(null);
      await loadProducts();
    } catch {
      setError("Failed to save product");
    }
  }

  if (loading) return <p style={{ color: "#7C8892" }}>Loading…</p>;

  return (
    <div>
      <h1>Products</h1>

      {error && <p style={{ color: "#E8631C", marginTop: 16 }}>{error}</p>}

      <input
        type="search"
        placeholder="Search products by name or SKU…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="form-input"
        style={{ marginTop: 16, marginBottom: 24, width: "100%", maxWidth: 400 }}
      />

      {products.length === 0 ? (
        <p style={{ color: "#7C8892" }}>No products found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #1A1F24", textAlign: "left" }}>
              <th style={{ padding: "8px 0" }}>SKU</th>
              <th style={{ padding: "8px 0" }}>Name</th>
              <th style={{ padding: "8px 0" }}>Category</th>
              <th style={{ padding: "8px 0" }}>Active</th>
              <th style={{ padding: "8px 0" }}></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product: any) => (
              <tr key={product.id} style={{ borderBottom: "1px solid #D5D9DD" }}>
                <td style={{ padding: "8px 0" }}>{product.sku}</td>
                <td style={{ padding: "8px 0" }}>
                  {editing === product.id ? (
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="form-input" style={{ width: "auto" }} />
                  ) : (
                    product.name
                  )}
                </td>
                <td style={{ padding: "8px 0" }}>{product.category?.name ?? "—"}</td>
                <td style={{ padding: "8px 0" }}>
                  {editing === product.id ? (
                    <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                  ) : (
                    product.active ? "Yes" : "No"
                  )}
                </td>
                <td style={{ padding: "8px 0" }}>
                  {editing === product.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => saveEdit(product.id)} className="btn btn-primary" style={{ fontSize: 13 }}>Save</button>
                      <button onClick={() => setEditing(null)} className="btn btn-outline-dark" style={{ fontSize: 13 }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(product)} className="btn btn-outline-dark" style={{ fontSize: 13 }}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
