"use client";

import { useEmailVerify } from "@/hooks/useEmailVerify";
import { signIn, signOut } from "@/lib/auth-client";
import { ChevronRight, Eye, EyeOff, Building2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function OrganizationSignupPage() {
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentPersonality, setAgentPersonality] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { check: checkEmail } = useEmailVerify();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    const useDark = stored === "dark" || (!stored && prefersDark);
    document.documentElement.setAttribute("data-mode", useDark ? "dark" : "light");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!orgName.trim()) { setError("Organisation name is required."); return; }
    if (!adminEmail.trim()) { setError("Admin email is required."); return; }
    if (!agentName.trim()) { setError("Agent name is required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    const emailOk = await checkEmail(adminEmail, true);
    if (!emailOk) return;

    setLoading(true);
    try {
      // Create Organization & User combined step
      const payload = {
        orgName: orgName.trim(),
        industry: industry.trim(),
        website: website.trim(),
        agentName: agentName.trim(),
        agentPersonality: agentPersonality.trim(),
        email: adminEmail.toLowerCase().trim(),
        password,
      };

      const res = await fetch("/api/auth/signup/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!data.ok) {
        setError(data.error || "Signup failed. Please try again.");
        setLoading(false);
        return;
      }
      try {
        localStorage.setItem("pending_verify_email", adminEmail.toLowerCase().trim());
      } catch {}

      // Clear any existing session before auto-signing into the new account.
      await signOut({ redirect: false });
      // Auto sign in using credentials provider
      const signInRes = await signIn("credentials", {
        email: adminEmail.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created — please sign in.");
        setLoading(false);
        return;
      }
      
      window.location.href = "/verify-email?type=organization";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root, [data-mode="light"] {
          --c-bg: #EFF7FF; --c-surface: #FFFFFF; --c-surface-2: #F8FAFC;
          --c-border: #C5DCF2; --c-text: #0B1E2E; --c-text-muted: #6B90AE;
          --c-org: #6366F1; --c-org-hover: #4F46E5;
          --c-danger: #EF4444; --c-danger-soft: #FEE2E2;
        }
        [data-mode="dark"] {
          --c-bg: #081420; --c-surface: #0F1E2D; --c-surface-2: #162435;
          --c-border: #1A3045; --c-text: #C8E8F8; --c-text-muted: #3D6580;
          --c-org: #818CF8; --c-org-hover: #6366F1;
          --c-danger: #F87171; --c-danger-soft: rgba(2ef,68,68,0.1);
        }

        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: var(--c-bg); color: var(--c-text); margin: 0; min-height: 100dvh; display: flex; flex-direction: column; }

        .auth-container { display: flex; flex: 1; align-items: center; justify-content: center; padding: 2rem 1rem; position: relative; z-index: 10; margin-top: 3rem; margin-bottom: 2rem; }
        .auth-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 1.5rem; padding: 2.5rem 2.5rem 3rem; width: 100%; max-width: 600px; box-shadow: 0 24px 64px rgba(0,0,0,0.1); }
        [data-mode="dark"] .auth-card { box-shadow: 0 24px 64px rgba(0,0,0,0.5); }

        .auth-header { text-align: center; margin-bottom: 2.5rem; }
        .auth-icon { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: color-mix(in srgb, var(--c-org) 15%, transparent); color: var(--c-org); border-radius: 12px; margin-bottom: 1rem; }
        .title { font-family: 'DM Serif Display', serif; font-size: 2rem; margin: 0 0 0.5rem; line-height: 1.1; }
        .subtitle { color: var(--c-text-muted); margin: 0; font-size: 0.95rem; }

        .input-group { margin-bottom: 1.25rem; }
        .label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.5rem; color: var(--c-text); }
        
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input { width: 100%; background: var(--c-surface-2); border: 1px solid var(--c-border); color: var(--c-text); border-radius: 0.75rem; padding: 0.8rem 1rem; font-family: inherit; font-size: 0.95rem; transition: border-color 0.2s; }
        .textarea { width: 100%; background: var(--c-surface-2); border: 1px solid var(--c-border); color: var(--c-text); border-radius: 0.75rem; padding: 0.8rem 1rem; font-family: inherit; font-size: 0.95rem; transition: border-color 0.2s; min-height: 80px; resize: vertical; }
        
        .input:focus, .textarea:focus { outline: none; border-color: var(--c-org); box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-org) 15%, transparent); }
        
        .toggle-btn { position: absolute; right: 1rem; background: none; border: none; color: var(--c-text-muted); cursor: pointer; padding: 0; display: flex; }
        .toggle-btn:hover { color: var(--c-text); }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 500px) { .form-row { grid-template-columns: 1fr; } }
        
        .section-separator { border-bottom: 1px dashed var(--c-border); margin: 1.5rem 0 1rem; padding-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; color: var(--c-text); }

        .btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--c-org); color: #fff; border: none; padding: 0.9rem 1rem; border-radius: 0.75rem; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: background 0.2s, transform 0.2s; margin-top: 1.5rem; }
        .btn:hover:not(:disabled) { background: var(--c-org-hover); transform: translateY(-1px); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .error { background: var(--c-danger-soft); color: var(--c-danger); padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid color-mix(in srgb, var(--c-danger) 20%, transparent); }

        .bottom-link { text-align: center; margin-top: 2rem; font-size: 0.9rem; color: var(--c-text-muted); }
        .bottom-link a { color: var(--c-text); font-weight: 600; text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.2s; margin-left: 0.25rem; }
        .bottom-link a:hover { border-color: var(--c-text); }

        .back-link { position: absolute; top: 2rem; left: 2rem; color: var(--c-text); opacity: 0.7; text-decoration: none; font-weight: 500; font-size: 0.9rem; display: flex; align-items: center; gap: 0.25rem; z-index: 20; transition: opacity 0.2s; }
        .back-link:hover { opacity: 1; }
        
        /* ambient bg */
        .ambient-bg { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
        .ambient-grid { position:absolute; inset:0; background-image:radial-gradient(var(--c-border) 1px, transparent 1px); background-size:30px 30px; opacity:0.3; mask-image:linear-gradient(to bottom, black 20%, transparent 80%); }
        .ambient-orb { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: color-mix(in srgb, var(--c-org) 10%, transparent); filter: blur(80px); right: -10vw; bottom: 0; pointer-events: none; }
      `}</style>
      
      <div className="ambient-bg">
        <div className="ambient-grid"></div>
        <div className="ambient-orb"></div>
      </div>

      <Link href="/onboarding" className="back-link">
        <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} /> Back to choices
      </Link>

      <main className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon"><Building2 size={20} /></div>
            <h1 className="title">Create Organisation</h1>
            <p className="subtitle">Set up your workspace and AI agent</p>
          </div>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="section-separator">Organisation Details</div>
            
            <div className="form-row">
              <div className="input-group">
                <label className="label">Organisation Name *</label>
                <input className="input" type="text" placeholder="Acme Corp" value={orgName} onChange={e => setOrgName(e.target.value)} disabled={loading} autoFocus />
              </div>

              <div className="input-group">
                <label className="label">Admin Email *</label>
                <input className="input" type="email" placeholder="admin@acme.com" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} disabled={loading} />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="label">Industry (Optional)</label>
                <input className="input" type="text" placeholder="E-commerce" value={industry} onChange={e => setIndustry(e.target.value)} disabled={loading} />
              </div>

              <div className="input-group">
                <label className="label">Website (Optional)</label>
                <input className="input" type="url" placeholder="https://acme.com" value={website} onChange={e => setWebsite(e.target.value)} disabled={loading} />
              </div>
            </div>

            <div className="section-separator" style={{marginTop: "0.5rem"}}>AI Agent Configuration</div>

            <div className="input-group">
              <label className="label">Agent Name *</label>
              <input className="input" type="text" placeholder="Support Bot" value={agentName} onChange={e => setAgentName(e.target.value)} disabled={loading} />
            </div>

            <div className="input-group">
              <label className="label">Agent Personality (Optional)</label>
              <textarea className="textarea" placeholder="Friendly, helpful, and concise..." value={agentPersonality} onChange={e => setAgentPersonality(e.target.value)} disabled={loading} />
            </div>

            <div className="section-separator" style={{marginTop: "0.5rem"}}>Security</div>

            <div className="input-group">
              <label className="label">Password *</label>
              <div className="input-wrapper">
                <input className="input" type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                <button type="button" className="toggle-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Creating workspace..." : "Create Organisation"}
            </button>
          </form>

          <div className="bottom-link">
            Already have an account? <Link href="/auth/signin">Sign in</Link>
          </div>
        </div>
      </main>
    </>
  );
}
