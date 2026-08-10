"use client";

import { useState, useEffect } from "react";
import { reviewsApi } from "../../lib/api-client";
import { useAuth } from "../../lib/hooks";

// Product reviews — displays existing reviews (star rating + text) and, if authenticated,
// a submit-review form. One review per product per account (enforced server-side).
// See guidelines/12-storefront-ux-and-ia.md Section "PDP" and guidelines/03-catalogue.md.
export function ProductReviews({ sku }: { sku: string }) {
  const { auth } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function loadReviews() {
    setLoading(true);
    try {
      const data = await reviewsApi.listByProduct(sku);
      setReviews(data.items ?? []);
    } catch {
      // Silent fail — reviews are non-critical to the PDP
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [sku]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      await reviewsApi.create(sku, rating, body || undefined);
      setSuccess(true);
      setShowForm(false);
      setBody("");
      setRating(5);
      await loadReviews();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit review");
    }
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="product-reviews" style={{ marginTop: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18 }}>
          Reviews {avgRating && <span style={{ color: "var(--orange)", fontSize: 14 }}>★ {avgRating} ({reviews.length})</span>}
        </h2>
        {auth.isAuthenticated && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-outline-dark" style={{ fontSize: 13 }}>
            Write a Review
          </button>
        )}
      </div>

      {error && <div className="form-error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="form-success" role="status" style={{ marginBottom: 16 }}>Review submitted. Thank you!</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 12, padding: 16, border: "1px solid var(--line)", borderRadius: 8 }}>
          <div>
            <label className="form-label">Rating</label>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: star <= rating ? "var(--orange)" : "var(--steel-light)" }}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Your Review</label>
            <textarea
              className="form-input"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your experience with this product…"
              style={{ resize: "vertical" }}
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="btn btn-primary">Submit Review</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline-dark">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: "var(--steel)", fontSize: 14 }}>Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p style={{ color: "var(--steel)", fontSize: 14 }}>No reviews yet. Be the first to review this product.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {reviews.map((review: any) => (
            <div key={review.id} style={{ padding: 16, border: "1px solid var(--line)", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--slate)" }}>
                  {review.account?.name ?? "Anonymous"}
                </span>
                <span style={{ color: "var(--orange)", fontSize: 14 }}>
                  {"★".repeat(review.rating)}<span style={{ color: "var(--steel-light)" }}>{"★".repeat(5 - review.rating)}</span>
                </span>
              </div>
              {review.body && (
                <p style={{ fontSize: 14, color: "var(--slate)", marginTop: 8, lineHeight: 1.6 }}>{review.body}</p>
              )}
              <p style={{ fontSize: 12, color: "var(--steel)", marginTop: 8 }}>
                {new Date(review.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
