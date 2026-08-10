"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authApi } from "../../../lib/api-client";
import { useAuth } from "../../../lib/hooks";

// Account settings — profile update (name, companyName) and password change. The auth hooks
// provide the current account context; after a profile update, the local auth state is refreshed
// so the header name updates without a page reload.
export default function AccountSettingsPage() {
  const { auth } = useAuth();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  useEffect(() => {
    if (auth.name) setName(auth.name);
  }, [auth.name]);

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setProfileErr(null);
    setProfileMsg(null);
    try {
      await authApi.updateProfile({ name, companyName: companyName || undefined });
      setProfileMsg("Profile updated.");
    } catch (e) {
      setProfileErr(e instanceof Error ? e.message : "Failed to update profile");
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwErr("New passwords do not match.");
      return;
    }
    if (newPw.length < 8) {
      setPwErr("Password must be at least 8 characters.");
      return;
    }
    try {
      await authApi.changePassword(currentPw, newPw);
      setPwMsg("Password changed.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e) {
      setPwErr(e instanceof Error ? e.message : "Failed to change password");
    }
  }

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 600 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Account Settings</h1>
        <Link href="/account" style={{ fontSize: 14, color: "var(--steel)" }}>← Back to Account</Link>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>Profile</h2>
        {profileMsg && <div className="form-success" role="status" style={{ marginTop: 12 }}>{profileMsg}</div>}
        {profileErr && <div className="form-error" role="alert" style={{ marginTop: 12 }}>{profileErr}</div>}
        <form onSubmit={handleProfileUpdate} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={auth.email ?? ""} disabled style={{ opacity: 0.6 }} />
            <p style={{ fontSize: 12, color: "var(--steel)", marginTop: 4 }}>Email cannot be changed.</p>
          </div>
          <div>
            <label className="form-label">Name</label>
            <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Company Name</label>
            <input className="form-input" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="form-label">Account Type</label>
            <input className="form-input" type="text" value={auth.type ?? ""} disabled style={{ opacity: 0.6 }} />
          </div>
          <button type="submit" className="btn btn-primary">Save Profile</button>
        </form>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18 }}>Change Password</h2>
        {pwMsg && <div className="form-success" role="status" style={{ marginTop: 12 }}>{pwMsg}</div>}
        {pwErr && <div className="form-error" role="alert" style={{ marginTop: 12 }}>{pwErr}</div>}
        <form onSubmit={handlePasswordChange} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} />
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required minLength={8} />
          </div>
          <button type="submit" className="btn btn-primary">Change Password</button>
        </form>
      </section>
    </div>
  );
}
