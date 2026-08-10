"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Quote/RFQ request page — Project/Tender tier entry point (spec Section 4.3). The backend
// (task 2.6) is real: POST /v1/quotes creates a draft, POST /:id/submit sends it. This
// page collects line items (description + quantity), creates the quote, and submits it.
// Also the entry point for non-standard cut/bend shapes routed out of the standard cart
// (guidelines/04-made-to-length-configurator.md's cut/bend section).
export default function QuoteRequestPage() {
  const router = useRouter();
  const [items, setItems] = useState([{ description: "", quantity: 1 }]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function addItem() {
    setItems([...items, { description: "", quantity: 1 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: "description" | "quantity", value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      setError("Add at least one line item with a description.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
      const token = localStorage.getItem("roofsteel_access_token");
      if (!token) {
        router.push("/login?returnTo=/quote/request");
        return;
      }

      // Create the quote (DRAFT), then submit it (DRAFT → SENT) in two calls.
      const createRes = await fetch(`${apiUrl}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: validItems, notes }),
      });
      if (!createRes.ok) throw new Error("Failed to create quote");
      const quote = await createRes.json();

      await fetch(`${apiUrl}/quotes/${quote.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quote request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 700 }}>
      <h1>Request a Quote</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8, marginBottom: 24 }}>
        For bulk, project, or non-standard cut/bend requirements. An admin will price each line and respond within 1–2 business days.
      </p>

      {error && <div className="form-error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <input
                className="form-input"
                type="text"
                placeholder="Item description (e.g. 6mm rebar, 12m lengths, 200 units)"
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                className="form-input"
                type="number"
                min={1}
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value, 10) || 1)}
                style={{ width: 80 }}
              />
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(i)} style={{ color: "var(--steel)", background: "none", border: "none", cursor: "pointer", padding: 8 }}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={addItem} className="btn btn-outline-dark" style={{ alignSelf: "flex-start" }}>
          + Add another item
        </button>

        <label className="form-label">
          Notes <span style={{ color: "var(--steel)", fontSize: 12 }}>(optional — delivery requirements, site details, etc.)</span>
          <textarea
            className="form-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{ marginTop: 4 }}
          />
        </label>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Submitting…" : "Submit Quote Request"}
        </button>
      </form>

      <p style={{ marginTop: 24, fontSize: 14, color: "var(--steel)" }}>
        <Link href="/account" style={{ color: "var(--orange)" }}>Back to Account</Link>
      </p>
    </div>
  );
}
