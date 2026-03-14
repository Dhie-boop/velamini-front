"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";


function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to reset password.");
    }
  };

  return (
    <div className="si-page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="si-card" style={{ maxWidth: 400, width: "100%", padding: 32 }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: 12 }}>Reset your password</h2>
        {success ? (
          <div style={{ color: "#38AECC", marginBottom: 16 }}>
            Your password has been reset. <Link href="/auth/signin" style={{ color: "#29A9D4" }}>Sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ fontWeight: 500, color: "#6B90AE" }}>New password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="si-input"
              placeholder="Enter new password"
              autoComplete="new-password"
              required
              style={{ padding: 10, borderRadius: 8, border: "1.5px solid #C5DCF2" }}
            />
            <label style={{ fontWeight: 500, color: "#6B90AE" }}>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="si-input"
              placeholder="Repeat new password"
              autoComplete="new-password"
              required
              style={{ padding: 10, borderRadius: 8, border: "1.5px solid #C5DCF2" }}
            />
            {error && <div style={{ color: "#EF4444", fontSize: ".9rem" }}>{error}</div>}
            <button type="submit" className="si-primary-btn" style={{ marginTop: 8 }} disabled={loading}>
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
