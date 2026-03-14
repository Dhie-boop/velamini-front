"use client";

import { useEmailVerify } from "@/hooks/useEmailVerify";
import { signIn } from "@/lib/auth-client";
import { ChevronRight, Eye, EyeOff, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PersonalSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

  const handleGoogleSignIn = () => {
    setLoading(true);
    signIn("google", { callbackUrl: "/verify-email?type=personal" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!name.trim()) { setError("Full name is required."); return; }
    if (!email.trim()) { setError("Email is required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    const emailOk = await checkEmail(email, true);
    if (!emailOk) return;

    setLoading(true);
    try {
      // Create user
      const res = await fetch("/api/auth/signup/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json();
      
      if (!data.ok) {
        setError(data.error || "Signup failed. Please try again.");
        setLoading(false);
        return;
      }
      
      // Auto sign in using credentials provider
      const signInRes = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created — please sign in.");
        setLoading(false);
        return;
      }
      
      window.location.href = "/verify-email?type=personal";
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
          --c-accent: #29A9D4; --c-accent-hover: #1D8BB2;
          --c-danger: #EF4444; --c-danger-soft: #FEE2E2;
        }
        [data-mode="dark"] {
          --c-bg: #081420; --c-surface: #0F1E2D; --c-surface-2: #162435;
          --c-border: #1A3045; --c-text: #C8E8F8; --c-text-muted: #3D6580;
          --c-accent: #38AECC; --c-accent-hover: #2690AB;
          --c-danger: #F87171; --c-danger-soft: rgba(2ef,68,68,0.1);
        }

        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: var(--c-bg); color: var(--c-text); margin: 0; min-height: 100dvh; display: flex; flex-direction: column; }

        .auth-container { display: flex; flex: 1; align-items: center; justify-content: center; padding: 2rem 1rem; position: relative; z-index: 10; }
        .auth-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 1.5rem; padding: 2.5rem 2.5rem 3rem; width: 100%; max-width: 440px; box-shadow: 0 24px 64px rgba(0,0,0,0.1); }
        [data-mode="dark"] .auth-card { box-shadow: 0 24px 64px rgba(0,0,0,0.5); }

        .auth-header { text-align: center; margin-bottom: 2.5rem; }
        .auth-icon { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: color-mix(in srgb, var(--c-accent) 15%, transparent); color: var(--c-accent); border-radius: 12px; margin-bottom: 1rem; }
        .title { font-family: 'DM Serif Display', serif; font-size: 2rem; margin: 0 0 0.5rem; line-height: 1.1; }
        .subtitle { color: var(--c-text-muted); margin: 0; font-size: 0.95rem; }

        .input-group { margin-bottom: 1.25rem; }
        .label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.5rem; color: var(--c-text); }
        
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input { width: 100%; background: var(--c-surface-2); border: 1px solid var(--c-border); color: var(--c-text); border-radius: 0.75rem; padding: 0.8rem 1rem; font-family: inherit; font-size: 0.95rem; transition: border-color 0.2s; }
        .input:focus { outline: none; border-color: var(--c-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-accent) 15%, transparent); }
        
        .toggle-btn { position: absolute; right: 1rem; background: none; border: none; color: var(--c-text-muted); cursor: pointer; padding: 0; display: flex; }
        .toggle-btn:hover { color: var(--c-text); }

        .btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--c-accent); color: #fff; border: none; padding: 0.9rem 1rem; border-radius: 0.75rem; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: background 0.2s, transform 0.2s; margin-top: 1rem; }
        .btn:hover:not(:disabled) { background: var(--c-accent-hover); transform: translateY(-1px); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-outline { background: transparent; color: var(--c-text); border: 1px solid var(--c-border); margin-top: 0; }
        .btn-outline:hover:not(:disabled) { background: var(--c-surface-2); border-color: var(--c-text-muted); }

        .divider { display: flex; align-items: center; text-align: center; margin: 1.5rem 0; color: var(--c-text-muted); font-size: 0.85rem; font-weight: 500;}
        .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid var(--c-border); }
        .divider:not(:empty)::before { margin-right: .5em; }
        .divider:not(:empty)::after { margin-left: .5em; }
        .google-icon { width: 18px; height: 18px; }

        .error { background: var(--c-danger-soft); color: var(--c-danger); padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid color-mix(in srgb, var(--c-danger) 20%, transparent); }

        .bottom-link { text-align: center; margin-top: 2rem; font-size: 0.9rem; color: var(--c-text-muted); }
        .bottom-link a { color: var(--c-text); font-weight: 600; text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.2s; margin-left: 0.25rem; }
        .bottom-link a:hover { border-color: var(--c-text); }

        .back-link { position: absolute; top: 2rem; left: 2rem; color: var(--c-text); opacity: 0.7; text-decoration: none; font-weight: 500; font-size: 0.9rem; display: flex; align-items: center; gap: 0.25rem; z-index: 20; transition: opacity 0.2s; }
        .back-link:hover { opacity: 1; }
        
        /* ambient bg */
        .ambient-bg { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
        .ambient-grid { position:absolute; inset:0; background-image:radial-gradient(var(--c-border) 1px, transparent 1px); background-size:30px 30px; opacity:0.3; mask-image:linear-gradient(to bottom, black 20%, transparent 80%); }
      `}</style>
      
      <div className="ambient-bg">
        <div className="ambient-grid"></div>
      </div>

      <Link href="/onboarding" className="back-link">
        <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} /> Back to choices
      </Link>

      <main className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon"><User size={20} /></div>
            <h1 className="title">Create Personal Account</h1>
            <p className="subtitle">Set up your AI twin profile</p>
          </div>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="label">Full Name</label>
              <div className="input-wrapper">
                <input className="input" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} disabled={loading} autoFocus />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Email address</label>
              <div className="input-wrapper">
                <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Password</label>
              <div className="input-wrapper">
                <input className="input" type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                <button type="button" className="toggle-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
            
            <div className="divider">or</div>
            
            <button type="button" className="btn btn-outline" onClick={handleGoogleSignIn} disabled={loading}>
              <svg className="google-icon" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
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
