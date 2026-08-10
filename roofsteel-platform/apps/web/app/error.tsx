"use client";

// Error boundary — catches unhandled errors in any route segment. Reset button re-renders
// the segment without a full page reload.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container" style={{ padding: "64px 16px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, color: "var(--slate)", marginBottom: 16 }}>Something went wrong</h1>
      <p style={{ fontSize: 14, color: "var(--steel)", marginBottom: 32 }}>
        An unexpected error occurred. Please try again.
      </p>
      <button onClick={reset} className="btn btn-primary">
        Try Again
      </button>
    </div>
  );
}
