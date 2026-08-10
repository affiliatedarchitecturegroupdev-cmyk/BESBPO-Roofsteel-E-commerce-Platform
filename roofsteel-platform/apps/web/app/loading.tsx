// Loading UI — shown by Next.js while route segments load. Uses a minimal skeleton
// pattern that matches the content area, not a generic spinner.
export default function Loading() {
  return (
    <div className="container" style={{ padding: "32px 16px" }} aria-busy="true" aria-live="polite">
      <div style={{ height: 24, background: "var(--steel-light)", borderRadius: 4, width: "40%", marginBottom: 16 }} />
      <div style={{ height: 16, background: "var(--steel-light)", borderRadius: 4, width: "80%", marginBottom: 8 }} />
      <div style={{ height: 16, background: "var(--steel-light)", borderRadius: 4, width: "60%", marginBottom: 24 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: 200, background: "var(--steel-light)", borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}
