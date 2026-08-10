"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/hooks";

// POST /v1/auth/register is now fully real — bcrypt password hashing and JWT issuance.
// This page collects the fields, validates client-side, calls the register hook, stores
// the tokens, and redirects. Company name is optional — if provided, the account is
// flagged as a potential trade applicant, but the actual trade-account approval flow
// (trade-accounts module, task 2.3) is a separate step the admin approves.
export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const returnTo = searchParams.get("returnTo") ?? "/account";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name, companyName || undefined);
      router.push(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 480 }}>
      <h1>Create an Account</h1>
      <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8, marginBottom: 24 }}>
        Shop faster, save lists, and see your trade pricing.
      </p>

      {error && (
        <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label className="form-label">
          Full name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="form-input"
          />
        </label>

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
            autoComplete="new-password"
            minLength={8}
            className="form-input"
          />
        </label>

        <label className="form-label">
          Company name <span style={{ color: "var(--steel)", fontSize: 12 }}>(optional — for trade accounts)</span>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            autoComplete="organization"
            className="form-input"
          />
        </label>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p style={{ marginTop: 24, fontSize: 14, color: "var(--steel)" }}>
        Already have an account?{" "}
        <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} style={{ color: "var(--orange)" }}>
          Log in
        </Link>
      </p>
    </div>
  );
}
