"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "An error occurred.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Network or server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="si-page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="si-card" style={{ maxWidth: 400, width: "100%", padding: 32 }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: 12 }}>Forgot your password?</h2>
        {submitted ? (
          <div style={{ color: "#38AECC", marginBottom: 16 }}>
            If an account exists for <b>{email}</b>, a password reset link has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ fontWeight: 500, color: "#6B90AE" }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="si-input"
              placeholder="you@example.com"
              autoComplete="email"
              required
              style={{ padding: 10, borderRadius: 8, border: "1.5px solid #C5DCF2" }}
            />
            {error && <div style={{ color: "#EF4444", fontSize: ".9rem" }}>{error}</div>}
            <button type="submit" className="si-primary-btn" style={{ marginTop: 8 }}>
              Send reset link
            </button>
          </form>
        )}
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <Link href="/auth/signin" style={{ color: "#29A9D4" }}>Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
