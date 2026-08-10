// SCAFFOLD — Phase 2. The backend is fully real: POST /v1/auth/login
// (apps/api/src/auth/auth.module.ts) with real bcrypt verification. This page just
// needed to exist to call it. Real session/JWT issuance is still a TODO on the backend
// side (see Gap Analysis I Section 7) — a successful call here won't yet persist a
// logged-in session.
export default function LoginPage() {
  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <h1>Log In</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
        This page is scaffolded, not yet built — see the TODO comment above this component.
      </p>
    </div>
  );
}
