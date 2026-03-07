"use client";

import { Brain, MessageSquare, TrendingUp, Activity, CheckCircle2, AlertTriangle, RefreshCw, Play } from "lucide-react";
import { motion } from "framer-motion";
import type { Organization, Stats, OrgTab } from "@/types/organization/org-type";

interface Props {
  org: Organization;
  stats: Stats | null;
  onNavigate: (tab: OrgTab) => void;
}

export default function OrgOverview({ org, stats, onNavigate }: Props) {
  const usagePct   = Math.min(stats?.usagePercentage || 0, 100);
  const usageColor = usagePct >= 90 ? "var(--c-danger)" : usagePct >= 70 ? "var(--c-warn)" : "var(--c-success)";
  const trained    = org.knowledgeBase?.isModelTrained;

  const statCards = [
    { label: "Monthly Messages", value: `${stats?.monthlyMessageCount ?? 0}`, sub: `of ${stats?.monthlyMessageLimit ?? 0}`, Icon: MessageSquare, color: "#29A9D4", isUsage: true },
    { label: "Conversations",    value: `${stats?.totalConversations ?? 0}`,   sub: "all time",   Icon: Activity,      color: "#6366F1" },
    { label: "Total Messages",   value: `${stats?.totalMessages ?? 0}`,        sub: "all time",   Icon: TrendingUp,    color: "#10B981" },
    { label: "Agent Status",     value: trained ? "Ready" : "Untrained",       sub: trained ? "live & responding" : "needs training", Icon: Brain, color: trained ? "#10B981" : "#F59E0B" },
  ];

  const quickActions = [
    { label: "Train your agent",  sub: "Add Q&A pairs and documents", tab: "agent"    as OrgTab, color: "var(--c-org)"     },
    { label: "View API keys",     sub: "Integrate on your platform",  tab: "api"      as OrgTab, color: "var(--c-accent)"  },
    { label: "See analytics",     sub: "Conversations & usage data",  tab: "analytics"as OrgTab, color: "#10B981"          },
    { label: "Configure settings",sub: "Agent name, tone & hours",    tab: "settings" as OrgTab, color: "#F59E0B"          },
  ];

  return (
    <>
      <style>{`
        .ov{display:flex;flex-direction:column;gap:16px}
        .ov-stats{display:grid;gap:12px;grid-template-columns:repeat(2,1fr)}
        @media(min-width:700px){.ov-stats{grid-template-columns:repeat(4,1fr)}}

        .ov-stat{background:var(--c-surface);border:1px solid var(--c-border);border-radius:14px;padding:16px;box-shadow:var(--shadow-sm);position:relative;overflow:hidden;transition:background .3s,border-color .2s}
        .ov-stat::after{content:'';position:absolute;top:0;left:0;right:0;height:2.5px;background:var(--si-color);opacity:.7}
        .ov-stat:hover{border-color:var(--si-color);box-shadow:var(--shadow-md)}
        .ov-stat-ic{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--si-color) 12%,transparent);color:var(--si-color);margin-bottom:10px}
        .ov-stat-ic svg{width:13px;height:13px}
        .ov-stat-val{font-family:'DM Serif Display',serif;font-size:1.7rem;color:var(--c-text);letter-spacing:-.02em;line-height:1}
        .ov-stat-lbl{font-size:.67rem;font-weight:700;color:var(--c-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:2px}
        .ov-stat-sub{font-size:.65rem;color:var(--c-muted);margin-top:2px}

        .ov-usage{margin-top:8px;height:4px;background:var(--c-surface-2);border-radius:3px;overflow:hidden}
        .ov-usage-bar{height:100%;border-radius:3px;transition:width .5s}

        .ov-2col{display:grid;gap:16px}
        @media(min-width:680px){.ov-2col{grid-template-columns:1fr 1fr}}

        /* agent status */
        .ov-agent{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:12px;border:1px solid var(--c-border)}
        .ov-agent--trained{background:var(--c-success-soft);border-color:color-mix(in srgb,var(--c-success) 25%,transparent)}
        .ov-agent--untrained{background:var(--c-warn-soft);border-color:color-mix(in srgb,var(--c-warn) 25%,transparent)}
        .ov-agent-ic{width:40px;height:40px;border-radius:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
        .ov-agent--trained .ov-agent-ic{background:color-mix(in srgb,var(--c-success) 14%,transparent);color:var(--c-success)}
        .ov-agent--untrained .ov-agent-ic{background:color-mix(in srgb,var(--c-warn) 14%,transparent);color:var(--c-warn)}
        .ov-agent-ic svg{width:18px;height:18px}
        .ov-agent-info{flex:1;min-width:0}
        .ov-agent-title{font-size:.86rem;font-weight:700;color:var(--c-text)}
        .ov-agent-sub{font-size:.72rem;color:var(--c-muted);margin-top:2px;line-height:1.5}
        .ov-agent-time{font-size:.66rem;color:var(--c-muted);margin-top:4px}

        /* quick actions */
        .ov-qa{display:flex;flex-direction:column;gap:8px}
        .ov-qa-item{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:11px;border:1px solid var(--c-border);background:var(--c-surface-2);cursor:pointer;transition:all .14s;font-family:inherit;border:none;width:100%;text-align:left}
        .ov-qa-item:hover{background:var(--c-accent-soft);border-color:var(--c-accent);transform:translateX(3px)}
        .ov-qa-ic{width:30px;height:30px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--qi-color) 14%,transparent);color:var(--qi-color);border:1px solid var(--c-border);transition:all .14s}
        .ov-qa-item:hover .ov-qa-ic{background:var(--qi-color);color:#fff;border-color:var(--qi-color)}
        .ov-qa-ic svg{width:12px;height:12px}
        .ov-qa-lbl{font-size:.82rem;font-weight:600;color:var(--c-text);flex:1}
        .ov-qa-sub{font-size:.68rem;color:var(--c-muted);margin-top:1px}
        .ov-qa-arr{color:var(--c-muted);opacity:0;transition:opacity .13s,transform .13s}
        .ov-qa-item:hover .ov-qa-arr{opacity:1;transform:translateX(2px)}
      `}</style>

      <div className="ov">
        {/* Stats */}
        <div className="ov-stats">
          {statCards.map(({ label, value, sub, Icon, color, isUsage }, i) => (
            <motion.div key={label} className="ov-stat"
              style={{ "--si-color": color } as any}
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * .07, duration: .35 }}>
              <div className="ov-stat-ic"><Icon /></div>
              <div className="ov-stat-val">{value}</div>
              <div className="ov-stat-lbl">{label}</div>
              <div className="ov-stat-sub">{sub}</div>
              {isUsage && (
                <div className="ov-usage">
                  <div className="ov-usage-bar" style={{ width:`${usagePct}%`, background: usageColor }} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div className="ov-2col" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.28 }}>
          {/* Agent status */}
          <div className="od-card">
            <div className="od-card-title">AI Agent</div>
            <div className="od-card-sub">Your agent's current status and training details.</div>
            <div className={`ov-agent ${trained ? "ov-agent--trained" : "ov-agent--untrained"}`}>
              <div className="ov-agent-ic">
                {trained ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              </div>
              <div className="ov-agent-info">
                <div className="ov-agent-title">
                  {org.agentName || org.name} — {trained ? "Live & Ready" : "Needs Training"}
                </div>
                <div className="ov-agent-sub">
                  {trained
                    ? "Your agent is answering questions. Keep training to improve accuracy."
                    : "Add Q&A pairs and documents so your agent can answer customer questions."}
                </div>
                {trained && org.knowledgeBase?.lastTrainedAt && (
                  <div className="ov-agent-time">
                    Last trained: {new Date(org.knowledgeBase.lastTrainedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginTop:12, display:"flex", gap:8 }}>
              <button className="od-btn od-btn--org" onClick={() => onNavigate("agent")}>
                {trained ? <><RefreshCw size={13}/> Retrain</> : <><Play size={13}/> Train Agent</>}
              </button>
              <button className="od-btn od-btn--ghost" onClick={() => onNavigate("api")}>
                View API
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="od-card">
            <div className="od-card-title">Quick Actions</div>
            <div className="od-card-sub">Jump to the most common tasks.</div>
            <div className="ov-qa">
              {quickActions.map(({ label, sub, tab, color }) => (
                <button key={tab} className="ov-qa-item" style={{ "--qi-color": color } as any}
                  onClick={() => onNavigate(tab)}>
                  <div className="ov-qa-ic">
                    {tab === "agent"     && <Brain size={12}/>}
                    {tab === "api"       && <Activity size={12}/>}
                    {tab === "analytics" && <TrendingUp size={12}/>}
                    {tab === "settings"  && <MessageSquare size={12}/>}
                  </div>
                  <div style={{ flex:1, minWidth:0, textAlign:"left" }}>
                    <div className="ov-qa-lbl">{label}</div>
                    <div className="ov-qa-sub">{sub}</div>
                  </div>
                  <svg className="ov-qa-arr" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}