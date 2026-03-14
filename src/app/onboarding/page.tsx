"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Building2, ChevronRight, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";

const PERSONAL_FEATS = ["AI trained on your voice", "24/7 personal presence", "One shareable link", "Private & encrypted"];
const ORG_FEATS = ["Trained on your FAQs & docs", "REST API + embed widget", "Real-time analytics", "Team management"];

function OnboardingContent() {
  const searchParams = useSearchParams();
  const defaultMode = searchParams.get("type") === "org" ? "organization" : "personal";
  const [mode, setMode] = useState<"personal" | "organization">(defaultMode);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    const useDark = stored === "dark" || (!stored && prefersDark);
    document.documentElement.setAttribute("data-mode", useDark ? "dark" : "light");
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root, [data-mode="light"] {
          --c-bg: #EFF7FF; --c-surface: #FFFFFF;
          --c-border: #C5DCF2; --c-text: #0B1E2E; --c-muted: #6B90AE;
          --c-accent: #29A9D4; --c-org: #6366F1;
        }
        [data-mode="dark"] {
          --c-bg: #081420; --c-surface: #0F1E2D;
          --c-border: #1A3045; --c-text: #C8E8F8; --c-muted: #3D6580;
          --c-accent: #38AECC; --c-org: #818CF8;
        }

        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: var(--c-bg); color: var(--c-text); margin: 0; min-height: 100dvh; display: flex; flex-direction: column; transition: background 0.3s, color 0.3s; }

        .onboarding-wrap {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 3rem 1.5rem; max-width: 900px; margin: 0 auto; width: 100%; position: relative; z-index: 10;
        }

        .header-text { text-align: center; margin-bottom: 3.5rem; }
        .header-text h1 { font-family: 'DM Serif Display', serif; font-size: clamp(2.4rem, 6vw, 3.2rem); line-height: 1.1; margin: 0 0 1rem; }
        .header-text p { color: var(--c-muted); font-size: 1.05rem; max-width: 42ch; margin: 0 auto; line-height: 1.6; }

        .cards-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; width: 100%;
        }

        .type-card {
          background: var(--c-surface); border: 2px solid var(--c-border); border-radius: 1.5rem;
          padding: 2.5rem 2rem; cursor: pointer; position: relative; overflow: hidden;
          transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s, background 0.3s;
        }
        .type-card:hover { transform: translateY(-4px); }
        .type-card.personal:hover, .type-card.personal.active { border-color: var(--c-accent); box-shadow: 0 16px 40px rgba(41,169,212,0.12); }
        .type-card.organization:hover, .type-card.organization.active { border-color: var(--c-org); box-shadow: 0 16px 40px rgba(99,102,241,0.12); }

        .card-icon {
          width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;
        }
        .personal .card-icon { background: color-mix(in srgb, var(--c-accent) 15%, transparent); color: var(--c-accent); }
        .organization .card-icon { background: color-mix(in srgb, var(--c-org) 15%, transparent); color: var(--c-org); }

        .card-title { font-size: 1.4rem; font-weight: 600; margin: 0 0 0.5rem; }
        .card-desc { color: var(--c-muted); font-size: 0.95rem; line-height: 1.6; margin: 0 0 1.5rem; min-height: 3em; }

        .feat-list { list-style: none; padding: 0; margin: 0 0 2.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .feat-list li { display: flex; align-items: flex-start; gap: 0.75rem; font-size: 0.9rem; color: var(--c-text); }
        .personal .feat-list li svg { color: var(--c-accent); flex-shrink: 0; margin-top: 2px; }
        .organization .feat-list li svg { color: var(--c-org); flex-shrink: 0; margin-top: 2px; }

        .card-btn-container { display: flex; justify-content: center; }
        .card-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%; padding: 0.85rem; border-radius: 0.75rem; font-weight: 500;
          text-decoration: none; transition: background 0.2s, color 0.2s;
        }
        .personal .card-btn { background: color-mix(in srgb, var(--c-accent) 12%, transparent); color: var(--c-accent); }
        .personal:hover .card-btn, .personal.active .card-btn { background: var(--c-accent); color: #fff; }
        .organization .card-btn { background: color-mix(in srgb, var(--c-org) 12%, transparent); color: var(--c-org); }
        .organization:hover .card-btn, .organization.active .card-btn { background: var(--c-org); color: #fff; }

        .back-link { position: absolute; top: 2rem; left: 2rem; color: var(--c-text); opacity: 0.7; text-decoration: none; font-weight: 500; font-size: 0.9rem; display: flex; align-items: center; gap: 0.25rem; z-index: 20; transition: opacity 0.2s; }
        .back-link:hover { opacity: 1; }
        
        .sign-in-prompt { margin-top: 3rem; text-align: center; color: var(--c-muted); font-size: 0.95rem; }
        .sign-in-prompt a { color: var(--c-text); text-decoration: none; font-weight: 600; margin-left: 0.5rem; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
        .sign-in-prompt a:hover { border-color: var(--c-text); }
        
        .ambient-bg { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
        .ambient-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(41,169,212,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(41,169,212,0.05) 1px, transparent 1px); background-size:40px 40px; mask-image:linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%); }
        [data-mode="light"] .ambient-grid { opacity: 0.5; }

        @media (max-width: 600px) {
          .back-link { top: 1rem; left: 1rem; }
          .cards-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      
      <div className="ambient-bg">
        <div className="ambient-grid"></div>
      </div>

      <Link href="/" className="back-link">
        <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} /> Back home
      </Link>

      <div className="onboarding-wrap">
        <motion.div className="header-text" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1>Choose your account</h1>
          <p>Are you building a digital twin for yourself, or an AI support agent for your business?</p>
        </motion.div>

        <div className="cards-grid">
          {/* Personal Card */}
          <motion.div
            className={`type-card personal ${mode === "personal" ? "active" : ""}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            onMouseEnter={() => setMode("personal")}
          >
            <div className="card-icon"><User size={24} /></div>
            <h3 className="card-title">Personal</h3>
            <p className="card-desc">For creators, pros, and individuals who want a 24/7 AI twin.</p>
            
            <ul className="feat-list">
              {PERSONAL_FEATS.map(f => (
                <li key={f}><Check size={16} strokeWidth={3} /> {f}</li>
              ))}
            </ul>

            <div className="card-btn-container">
              <Link href="/auth/signup/personal" className="card-btn">
                Select Personal <ChevronRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Organization Card */}
          <motion.div
            className={`type-card organization ${mode === "organization" ? "active" : ""}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            onMouseEnter={() => setMode("organization")}
          >
            <div className="card-icon"><Building2 size={24} /></div>
            <h3 className="card-title">Organisation</h3>
            <p className="card-desc">For startups and businesses needing customer AI support agents.</p>
            
            <ul className="feat-list">
              {ORG_FEATS.map(f => (
                <li key={f}><Check size={16} strokeWidth={3} /> {f}</li>
              ))}
            </ul>

            <div className="card-btn-container">
              <Link href="/auth/signup/organization" className="card-btn">
                Select Organisation <ChevronRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div className="sign-in-prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          Already have an account? <Link href="/auth/signin">Sign in instead</Link>
        </motion.div>
      </div>
    </>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="onboarding-wrap">Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
