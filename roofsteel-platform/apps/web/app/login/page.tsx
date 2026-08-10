"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/hooks";

// POST /v1/auth/login is now fully real (apps/api/src/auth/auth.module.ts) — bcrypt
// password verification and JWT issuance. This page calls it, stores the tokens, and
// redirects to the returnTo URL or /account. The auth state is managed by useAuth()
// in lib/hooks.ts, which stores tokens in localStorage and the API client attaches them
// automatically to every request.
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const returnTo = searchParams.get("returnTo") ?? "/account";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 480 }}>
      <h1>Log In</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8, marginBottom: 24 }}>
        Sign in to see your trade pricing, orders, and saved lists.
      </p>

      {error && (
        <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label className="form-label">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="form-input"
          />
        </label>

        <label className="form-label">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="form-input"
          />
        </label>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Signing in…" : "Log In"}
        </button>
      </form>

      <p style={{ marginTop: 24, fontSize: 14, color: "var(--steel)" }}>
        Don&apos;t have an account?{" "}
        <Link href={`/register?returnTo=${encodeURIComponent(returnTo)}`} style={{ color: "var(--orange)" }}>
          Create one
        </Link>
      </p>
    </div>
  );
}
