"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Zap, Brain, Code2, BarChart3, Settings,
  Sun, Moon, Building2,
} from "lucide-react";

import OrgOverview   from "@/components/organization/overview";
import OrgAgent      from "@/components/organization/agent";
import OrgApi        from "@/components/organization/api";
import OrgAnalytics  from "@/components/organization/analytics";
import OrgSettings   from "@/components/organization/settings";
import { ORG_CSS }   from "@/types/organization/org-type";
import type { Organization, Stats, OrgTab } from "@/types/organization/org-type";

// ── Tab config ───────────────────────────────────────────────────────────────
const TABS: { id: OrgTab; label: string; Icon: any }[] = [
  { id: "overview",  label: "Overview",    Icon: Zap      },
  { id: "agent",     label: "AI Agent",    Icon: Brain    },
  { id: "api",       label: "API & Embed", Icon: Code2    },
  { id: "analytics", label: "Analytics",   Icon: BarChart3},
  { id: "settings",  label: "Settings",    Icon: Settings },
];

export default function OrganizationDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const orgId   = params?.id as string;

  const [org,     setOrg]     = useState<Organization | null>(null);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<OrgTab>("overview");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");
  const [isDark,  setIsDark]  = useState(true);
  const [mounted, setMounted] = useState(false);

  // ── Theme ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("theme") || "dark";
      setIsDark(stored === "dark");
      document.documentElement.setAttribute("data-mode", stored);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const mode = next ? "dark" : "light";
    document.documentElement.setAttribute("data-mode", mode);
    localStorage.setItem("theme", mode);
  };

  // ── Data fetch ─────────────────────────────────────────────────────────────
  useEffect(() => { fetchOrg(); fetchStats(); }, [orgId]);

  const fetchOrg = async () => {
    try {
      const r = await fetch(`/api/organizations/${orgId}`);
      const d = await r.json();
      if (d.ok) setOrg(d.organization);
    } catch {}
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const r = await fetch(`/api/organizations/${orgId}/stats`);
      const d = await r.json();
      if (d.ok) setStats(d.stats);
    } catch {}
  };

  // ── Save helper (passed to child components) ───────────────────────────────
  const handleSave = async (updates: Partial<Organization>) => {
    setSaving(true); setSaved(false); setError("");
    try {
      const r = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const d = await r.json();
      if (d.ok) {
        setOrg(d.organization);
        setSaved(true);
        setTimeout(() => setSaved(false), 2400);
      } else {
        setError(d.error || "Failed to save.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / not found ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--c-bg)" }}>
      <style>{ORG_CSS}</style>
      <div className="od-spinner od-spinner--dark" style={{ width:32, height:32, borderWidth:3 }} />
    </div>
  );

  if (!org) return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--c-bg)", flexDirection:"column", gap:14 }}>
      <style>{ORG_CSS}</style>
      <div style={{ fontFamily:"DM Serif Display,serif", fontSize:"1.3rem", color:"var(--c-text)" }}>Organisation not found</div>
      <button className="od-btn od-btn--ghost" onClick={() => router.push("/Dashboard/organizations")}>
        <ArrowLeft size={13}/> Back to organisations
      </button>
    </div>
  );

  return (
    <>
      <style>{ORG_CSS}</style>
      <style>{`
        /* ── Page shell ─────────────────────────────────────────────────────── */
        .odp{min-height:100dvh;background:var(--c-bg);transition:background .3s}
        .odp-inner{max-width:1020px;margin:0 auto;padding:20px 14px 72px}
        @media(min-width:600px){.odp-inner{padding:28px 24px 80px}}
        @media(min-width:1024px){.odp-inner{padding:36px 40px 80px}}

        /* ── Header ─────────────────────────────────────────────────────────── */
        .odp-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:26px}
        .odp-hd-left{display:flex;align-items:center;gap:13px;min-width:0}
        .odp-org-ic{width:50px;height:50px;border-radius:14px;background:var(--c-org-soft);border:1.5px solid color-mix(in srgb,var(--c-org) 24%,transparent);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--c-org)}
        .odp-org-ic svg{width:22px;height:22px}
        .odp-name{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(1.35rem,4vw,1.8rem);font-weight:400;letter-spacing:-.022em;color:var(--c-text);line-height:1.2}
        .odp-desc{font-size:.76rem;color:var(--c-muted);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:360px}
        .odp-hd-right{display:flex;align-items:center;gap:8px;flex-shrink:0}

        /* status chip */
        .odp-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;font-size:.64rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
        .odp-chip--active{background:var(--c-success-soft);color:var(--c-success)}
        .odp-chip--inactive{background:var(--c-danger-soft);color:var(--c-danger)}
        .odp-chip-dot{width:5px;height:5px;border-radius:50%;background:currentColor;animation:chipPulse 2s infinite}
        @keyframes chipPulse{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}

        /* theme btn */
        .odp-theme-btn{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:1px solid var(--c-border);background:var(--c-surface-2);color:var(--c-muted);cursor:pointer;transition:all .14s}
        .odp-theme-btn:hover{color:var(--c-accent);border-color:var(--c-accent);background:var(--c-accent-soft)}
        .odp-theme-btn svg{width:14px;height:14px}

        /* ── Tabs ────────────────────────────────────────────────────────────── */
        .odp-tabs{display:flex;gap:2px;background:var(--c-surface-2);border:1px solid var(--c-border);border-radius:14px;padding:4px;overflow-x:auto;scrollbar-width:none;margin-bottom:22px}
        .odp-tabs::-webkit-scrollbar{display:none}
        .odp-tab{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:none;background:none;font-size:.76rem;font-weight:600;color:var(--c-muted);cursor:pointer;font-family:inherit;transition:all .14s;white-space:nowrap;flex-shrink:0}
        .odp-tab:hover{color:var(--c-text);background:var(--c-surface)}
        .odp-tab--on{background:var(--c-surface)!important;color:var(--c-org);box-shadow:var(--shadow-sm)}
        .odp-tab svg{width:13px;height:13px}
      `}</style>

      <div className="odp">
        <div className="odp-inner">

          {/* Back link */}
          <button className="od-btn od-btn--ghost"
            style={{ marginBottom:18, fontSize:".74rem", padding:"6px 12px" }}
            onClick={() => router.push("/Dashboard/organizations")}>
            <ArrowLeft size={13}/> All organisations
          </button>

          {/* Header */}
          <div className="odp-hd">
            <div className="odp-hd-left">
              <div className="odp-org-ic"><Building2 size={22}/></div>
              <div style={{ minWidth:0 }}>
                <div className="odp-name">{org.name}</div>
                {org.description && <div className="odp-desc">{org.description}</div>}
              </div>
            </div>
            <div className="odp-hd-right">
              <span className={`odp-chip ${org.isActive ? "odp-chip--active" : "odp-chip--inactive"}`}>
                <span className="odp-chip-dot"/>
                {org.isActive ? "Active" : "Inactive"}
              </span>
              {mounted && (
                <button className="odp-theme-btn" onClick={toggleTheme} title="Toggle theme">
                  {isDark ? <Sun size={14}/> : <Moon size={14}/>}
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="odp-tabs">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id}
                className={`odp-tab ${tab === id ? "odp-tab--on" : ""}`}
                onClick={() => setTab(id)}>
                <Icon size={13}/> {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div key={tab}
              initial={{ opacity:0, y:10 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-6 }}
              transition={{ duration:.18, ease:"easeOut" }}>

              {tab === "overview"  && (
                <OrgOverview org={org} stats={stats} onNavigate={setTab} />
              )}
              {tab === "agent" && (
                <OrgAgent
                  org={org}
                  onSave={handleSave}
                  onRefresh={fetchOrg}
                  saving={saving}
                  saved={saved}
                  error={error}
                />
              )}
              {tab === "api" && (
                <OrgApi
                  org={org}
                  onKeyRotated={(newKey) => setOrg(prev => prev ? { ...prev, apiKey: newKey } : prev)}
                />
              )}
              {tab === "analytics" && (
                <OrgAnalytics stats={stats} />
              )}
              {tab === "settings" && (
                <OrgSettings
                  org={org}
                  onSave={handleSave}
                  saving={saving}
                  saved={saved}
                  error={error}
                />
              )}

            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </>
  );
}