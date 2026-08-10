// SCAFFOLD — Phase 3. Shows one of four real states (not applied / pending / approved /
// rejected with reason) — the backend (GET /v1/trade-accounts/me) is already real,
// apps/api/src/trade-accounts/trade-accounts.module.ts. This is purely a frontend gap.
export default function TradeAccountStatusPage() {
  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <h1>Trade Account</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
        This page is scaffolded, not yet built — see the TODO comment above this component.
      </p>
    </div>
  );
}
