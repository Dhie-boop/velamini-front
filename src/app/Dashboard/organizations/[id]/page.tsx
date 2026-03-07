"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Zap, Brain, Code2, BarChart3, Settings,
  Sun, Moon, Building2, ChevronRight, Search, Bell, Menu, X,
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
  const [isDark,     setIsDark]    = useState(true);
  const [mounted,    setMounted]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search,     setSearch]     = useState("");

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
        /* ── Shell ───────────────────────────────────────────────────── */
        .odp{display:flex;min-height:100dvh;background:var(--c-bg);transition:background .3s}

        /* ── Sidebar ─────────────────────────────────────────────────── */
        .odp-sb{display:none}
        @media(min-width:1024px){
          .odp-sb{
            display:flex;flex-direction:column;width:230px;flex-shrink:0;
            height:100vh;position:sticky;top:0;
            background:var(--c-sidebar);border-right:1px solid var(--c-border);
            overflow:hidden;transition:background .3s,border-color .3s;
          }
        }
        .odp-sb-head{
          display:flex;align-items:center;gap:10px;
          padding:16px 14px 12px;border-bottom:1px solid var(--c-border);flex-shrink:0;
        }
        .odp-sb-orgic{
          width:34px;height:34px;border-radius:9px;
          background:var(--c-org-soft);border:1.5px solid color-mix(in srgb,var(--c-org) 24%,transparent);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--c-org);
        }
        .odp-sb-orgic svg{width:15px;height:15px}
        .odp-sb-orgname{
          font-family:'DM Serif Display',Georgia,serif;font-size:.88rem;font-weight:400;
          color:var(--c-text);letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        }
        .odp-sb-chip{
          display:inline-flex;align-items:center;gap:4px;
          font-size:.55rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
          padding:2px 7px;border-radius:20px;margin-top:2px;
        }
        .odp-sb-chip--active{background:var(--c-success-soft);color:var(--c-success)}
        .odp-sb-chip--inactive{background:var(--c-danger-soft);color:var(--c-danger)}
        .odp-sb-chip-dot{width:4px;height:4px;border-radius:50%;background:currentColor}
        .odp-sb-nav{flex:1;overflow-y:auto;padding:10px;scrollbar-width:none}
        .odp-sb-nav::-webkit-scrollbar{display:none}
        .odp-sb-lbl{font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--c-muted);padding:8px 8px 4px}
        .odp-sb-item{
          display:flex;align-items:center;gap:10px;
          padding:9px 10px;border-radius:10px;border:1px solid transparent;
          cursor:pointer;transition:all .13s;margin-bottom:2px;
          background:none;width:100%;text-align:left;font-family:inherit;min-height:42px;
        }
        .odp-sb-item:hover{background:var(--c-surface-2)}
        .odp-sb-item--on{background:var(--c-accent-soft)!important;border-color:color-mix(in srgb,var(--c-org) 28%,transparent)}
        .odp-sb-icon{
          width:30px;height:30px;border-radius:8px;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;
          background:var(--c-surface-2);color:var(--c-muted);transition:background .13s,color .13s;
        }
        .odp-sb-icon svg{width:13px;height:13px}
        .odp-sb-item--on .odp-sb-icon{background:var(--c-org);color:#fff}
        .odp-sb-item:hover:not(.odp-sb-item--on) .odp-sb-icon{background:var(--c-surface);color:var(--c-org)}
        .odp-sb-itemlbl{flex:1;font-size:.82rem;font-weight:500;color:var(--c-muted);transition:color .13s}
        .odp-sb-item--on .odp-sb-itemlbl{color:var(--c-org);font-weight:600}
        .odp-sb-item:hover:not(.odp-sb-item--on) .odp-sb-itemlbl{color:var(--c-text)}
        .odp-sb-arr{opacity:0;color:var(--c-org);transition:opacity .13s}
        .odp-sb-item--on .odp-sb-arr{opacity:1}
        .odp-sb-foot{flex-shrink:0;padding:10px 10px 14px;border-top:1px solid var(--c-border);display:flex;flex-direction:column;gap:6px}
        .odp-sb-back{
          display:flex;align-items:center;gap:7px;width:100%;
          padding:8px 10px;border-radius:9px;border:1px solid var(--c-border);
          background:var(--c-surface-2);color:var(--c-muted);
          font-size:.74rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .13s;
        }
        .odp-sb-back:hover{color:var(--c-text);border-color:var(--c-text)}
        .odp-sb-back svg{width:12px;height:12px}
        .odp-sb-thm{
          display:flex;align-items:center;justify-content:center;gap:7px;width:100%;
          padding:8px 10px;border-radius:9px;border:1px solid var(--c-border);
          background:transparent;color:var(--c-muted);
          font-size:.74rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .13s;
        }
        .odp-sb-thm:hover{color:var(--c-accent);border-color:var(--c-accent);background:var(--c-accent-soft)}
        .odp-sb-thm svg{width:13px;height:13px}

        /* ── Content column ──────────────────────────────────────────── */
        .odp-main{flex:1;min-width:0;overflow-y:auto}
        .odp-inner{max-width:980px;margin:0 auto;padding:20px 14px 72px}
        @media(min-width:600px){.odp-inner{padding:28px 24px 80px}}
        @media(min-width:1024px){.odp-inner{padding:32px 36px 80px}}

        /* ── Mobile tab bar (hidden on desktop) ──────────────────────── */
        .odp-mob-tabs{display:flex;gap:2px;background:var(--c-surface-2);border:1px solid var(--c-border);border-radius:14px;padding:4px;overflow-x:auto;scrollbar-width:none;margin-bottom:20px}
        .odp-mob-tabs::-webkit-scrollbar{display:none}
        @media(min-width:1024px){.odp-mob-tabs{display:none}}
        .odp-mob-tab{display:flex;align-items:center;gap:6px;padding:8px 13px;border-radius:10px;border:none;background:none;font-size:.76rem;font-weight:600;color:var(--c-muted);cursor:pointer;font-family:inherit;transition:all .14s;white-space:nowrap;flex-shrink:0}
        .odp-mob-tab:hover{color:var(--c-text);background:var(--c-surface)}
        .odp-mob-tab--on{background:var(--c-surface)!important;color:var(--c-org);box-shadow:var(--shadow-sm)}
        .odp-mob-tab svg{width:13px;height:13px}

        /* ── Page header (mobile back + org name) ────────────────────── */
        .odp-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:22px}
        .odp-hd-left{display:flex;align-items:center;gap:12px;min-width:0}
        .odp-org-ic{width:46px;height:46px;border-radius:13px;background:var(--c-org-soft);border:1.5px solid color-mix(in srgb,var(--c-org) 24%,transparent);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--c-org)}
        .odp-org-ic svg{width:20px;height:20px}
        .odp-name{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(1.25rem,4vw,1.65rem);font-weight:400;letter-spacing:-.022em;color:var(--c-text);line-height:1.2}
        .odp-desc{font-size:.75rem;color:var(--c-muted);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:340px}
        .odp-hd-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
        .odp-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;font-size:.64rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
        .odp-chip--active{background:var(--c-success-soft);color:var(--c-success)}
        .odp-chip--inactive{background:var(--c-danger-soft);color:var(--c-danger)}
        .odp-chip-dot{width:5px;height:5px;border-radius:50%;background:currentColor;animation:chipPulse 2s infinite}
        @keyframes chipPulse{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
        .odp-theme-btn{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:1px solid var(--c-border);background:var(--c-surface-2);color:var(--c-muted);cursor:pointer;transition:all .14s}
        .odp-theme-btn:hover{color:var(--c-accent);border-color:var(--c-accent);background:var(--c-accent-soft)}
        .odp-theme-btn svg{width:14px;height:14px}
        /* hide back btn + theme toggle on desktop (sidebar handles them) */
        .odp-mob-back{display:inline-flex}
        .odp-hd-right .odp-theme-btn{display:flex}
        @media(min-width:1024px){.odp-mob-back{display:none}.odp-hd-right .odp-theme-btn{display:none}}
      `}</style>

      <div className="odp">

        {/* ── Sidebar (desktop) ──────────────────────────────────────── */}
        <aside className="odp-sb">
          <div className="odp-sb-head">
            <div className="odp-sb-orgic"><Building2 /></div>
            <div style={{ minWidth: 0 }}>
              <div className="odp-sb-orgname">{org.name}</div>
              <div className={`odp-sb-chip ${org.isActive ? "odp-sb-chip--active" : "odp-sb-chip--inactive"}`}>
                <span className="odp-sb-chip-dot"/>
                {org.isActive ? "Active" : "Inactive"}
              </div>
            </div>
          </div>

          <nav className="odp-sb-nav">
            <div className="odp-sb-lbl">Navigation</div>
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`odp-sb-item ${tab === id ? "odp-sb-item--on" : ""}`}
                onClick={() => setTab(id)}
              >
                <div className="odp-sb-icon"><Icon /></div>
                <span className="odp-sb-itemlbl">{label}</span>
                <ChevronRight size={11} className="odp-sb-arr" />
              </button>
            ))}
          </nav>

          <div className="odp-sb-foot">
            {mounted && (
              <button className="odp-sb-thm" onClick={toggleTheme}>
                {isDark ? <Sun size={13}/> : <Moon size={13}/>}
                {isDark ? "Light mode" : "Dark mode"}
              </button>
            )}
            <button className="odp-sb-back" onClick={() => router.push("/Dashboard/organizations")}>
              <ArrowLeft /> All organisations
            </button>
          </div>
        </aside>

        {/* ── Main content ───────────────────────────────────────────── */}
        <div className="odp-main">
          <div className="odp-inner">

            {/* Mobile header */}
            <div className="odp-hd">
              <div className="odp-hd-left">
                <button
                  className="od-btn od-btn--ghost odp-mob-back"
                  style={{ fontSize: ".74rem", padding: "6px 10px" }}
                  onClick={() => router.push("/Dashboard/organizations")}
                >
                  <ArrowLeft size={13}/>
                </button>
                <div className="odp-org-ic"><Building2 size={20}/></div>
                <div style={{ minWidth: 0 }}>
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

            {/* Mobile tab bar */}
            <div className="odp-mob-tabs">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={`odp-mob-tab ${tab === id ? "odp-mob-tab--on" : ""}`}
                  onClick={() => setTab(id)}
                >
                  <Icon size={13}/> {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: .18, ease: "easeOut" }}>

                {tab === "overview" && (
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
      </div>
    </>
  );
}
