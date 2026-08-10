"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { addressesApi, type AddressDto } from "../../../lib/api-client";
import type { Province } from "@roofsteel/shared-types";

// Address management page — full CRUD against GET/POST/PUT/DELETE /v1/addresses (task 2.5
// backend is real). Single-default-address constraint is enforced server-side; this page
// just sends the isDefault flag and the API handles the rest. Province is a dropdown of
// the seven South African provinces the API and Prisma schema support.
const PROVINCES: Province[] = [
  "GAUTENG", "KWAZULU_NATAL", "WESTERN_CAPE", "LIMPOPO",
  "MPUMALANGA", "EASTERN_CAPE", "NORTH_WEST",
];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AddressDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState<Province>("GAUTENG");
  const [postalCode, setPostalCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  async function loadAddresses() {
    setLoading(true);
    try {
      const data = await addressesApi.list();
      setAddresses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  function startEdit(addr: AddressDto) {
    setEditing(addr);
    setLine1(addr.line1);
    setLine2(addr.line2 ?? "");
    setCity(addr.city);
    setProvince(addr.province as Province);
    setPostalCode(addr.postalCode);
    setIsDefault(addr.isDefault);
    setShowForm(true);
  }

  function startCreate() {
    setEditing(null);
    setLine1("");
    setLine2("");
    setCity("");
    setProvince("GAUTENG");
    setPostalCode("");
    setIsDefault(false);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = { line1, line2, city, province, postalCode, isDefault };
      if (editing) {
        await addressesApi.update(editing.id, data);
      } else {
        await addressesApi.create(data);
      }
      setShowForm(false);
      await loadAddresses();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save address");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return;
    try {
      await addressesApi.remove(id);
      await loadAddresses();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete address");
    }
  }

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 600 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Addresses</h1>
        <Link href="/account" style={{ fontSize: 14, color: "var(--steel)" }}>← Back to Account</Link>
      </div>

      {error && <div className="form-error" role="alert" style={{ marginTop: 16 }}>{error}</div>}

      {loading ? (
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 16 }}>Loading…</p>
      ) : addresses.length === 0 && !showForm ? (
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 16, marginBottom: 16 }}>
          No saved addresses yet.
        </p>
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {addresses.map((addr) => (
            <div key={addr.id} style={{ padding: 16, border: "1px solid var(--steel-light)", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{addr.line1}</p>
                  {addr.line2 && <p style={{ fontSize: 14, color: "var(--steel)" }}>{addr.line2}</p>}
                  <p style={{ fontSize: 14, color: "var(--steel)" }}>
                    {addr.city}, {addr.province.replace(/_/g, " ")} {addr.postalCode}
                  </p>
                  {addr.isDefault && (
                    <span style={{ fontSize: 12, color: "var(--orange)", fontWeight: 600 }}>DEFAULT</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => startEdit(addr)} className="btn btn-outline-dark" style={{ fontSize: 13 }}>Edit</button>
                  <button onClick={() => handleDelete(addr.id)} style={{ fontSize: 13, color: "var(--steel)", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontSize: 18 }}>{editing ? "Edit Address" : "New Address"}</h2>
          <input className="form-input" type="text" placeholder="Street address" value={line1} onChange={(e) => setLine1(e.target.value)} required />
          <input className="form-input" type="text" placeholder="Apartment, suite, etc. (optional)" value={line2} onChange={(e) => setLine2(e.target.value)} />
          <input className="form-input" type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
          <select className="form-input" value={province} onChange={(e) => setProvince(e.target.value as Province)}>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p.replace(/_/g, " ")}</option>
            ))}
          </select>
          <input className="form-input" type="text" placeholder="Postal code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required maxLength={10} />
          <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            Set as default address
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="btn btn-primary">{editing ? "Update" : "Add"} Address</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline-dark">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={startCreate} className="btn btn-outline-dark" style={{ marginTop: 16 }}>+ Add New Address</button>
      )}
    </div>
  );
}
