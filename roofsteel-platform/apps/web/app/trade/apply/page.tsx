// SCAFFOLD — Phase 2/3. The backend is fully real: POST /v1/trade-accounts/apply
// (apps/api/src/trade-accounts/trade-accounts.module.ts). This page just needed to exist
// to call it — form fields: companyName, registrationNo, matching ApplyForTradeAccountDto.
export default function TradeApplyPage() {
  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <h1>Apply for a Trade Account</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
        This page is scaffolded, not yet built — see the TODO comment above this component.
      </p>
    </div>
  );
}
