"use client";

import { useState } from "react";
import { MessageSquare, TrendingUp, Users, Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, CartesianGrid,
} from "recharts";
import type { Stats } from "@/types/organization/org-type";

interface Props {
  stats: Stats | null;
}

// Mock chart data — replace with real API data
const mockDailyMessages = [
  { day: "Mon", messages: 12 }, { day: "Tue", messages: 28 },
  { day: "Wed", messages: 19 }, { day: "Thu", messages: 41 },
  { day: "Fri", messages: 35 }, { day: "Sat", messages: 14 },
  { day: "Sun", messages: 9  },
];

const mockConvGrowth = [
  { week: "W1", conversations: 4  }, { week: "W2", conversations: 11 },
  { week: "W3", conversations: 18 }, { week: "W4", conversations: 31 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"var(--c-surface)", border:"1px solid var(--c-border)", borderRadius:9,
      padding:"8px 12px", fontSize:".74rem", color:"var(--c-text)", boxShadow:"var(--shadow-md)",
    }}>
      <div style={{ fontWeight:700, marginBottom:2 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function OrgAnalytics({ stats }: Props) {
  const [convPage, setConvPage] = useState(0);
  const PER_PAGE = 6;

  const convs    = stats?.recentConversations ?? [];
  const paged    = convs.slice(convPage * PER_PAGE, (convPage + 1) * PER_PAGE);
  const hasMore  = (convPage + 1) * PER_PAGE < convs.length;
  const hasPrev  = convPage > 0;
  const usagePct = Math.min(stats?.usagePercentage ?? 0, 100);

  const metricCards = [
    { label: "Total Conversations", value: stats?.totalConversations ?? 0, Icon: Users,          color: "#6366F1" },
    { label: "Total Messages",      value: stats?.totalMessages ?? 0,      Icon: MessageSquare,  color: "#29A9D4" },
    { label: "This Month",          value: stats?.monthlyMessageCount ?? 0, Icon: TrendingUp,    color: "#10B981" },
    { label: "Monthly Limit",       value: stats?.monthlyMessageLimit ?? 0, Icon: Clock,         color: "#F59E0B" },
  ];

  return (
    <>
      <style>{`
        .oan{display:flex;flex-direction:column;gap:16px}
        .oan-metrics{display:grid;gap:10px;grid-template-columns:repeat(2,1fr)}
        @media(min-width:700px){.oan-metrics{grid-template-columns:repeat(4,1fr)}}

        .oan-metric{background:var(--c-surface);border:1px solid var(--c-border);border-radius:14px;padding:14px 16px;box-shadow:var(--shadow-sm);position:relative;overflow:hidden;transition:border-color .15s}
        .oan-metric::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--am-color)}
        .oan-metric:hover{border-color:var(--am-color)}
        .oan-metric-ic{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--am-color) 12%,transparent);color:var(--am-color);margin-bottom:8px}
        .oan-metric-ic svg{width:12px;height:12px}
        .oan-metric-val{font-family:'DM Serif Display',serif;font-size:1.6rem;color:var(--c-text);letter-spacing:-.02em;line-height:1}
        .oan-metric-lbl{font-size:.65rem;font-weight:700;color:var(--c-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:2px}

        /* usage bar */
        .oan-usage-wrap{margin-top:10px}
        .oan-usage-head{display:flex;justify-content:space-between;font-size:.68rem;color:var(--c-muted);margin-bottom:4px}
        .oan-usage-track{height:5px;background:var(--c-surface-2);border-radius:3px;overflow:hidden}
        .oan-usage-fill{height:100%;border-radius:3px;transition:width .5s}

        /* charts grid */
        .oan-charts{display:grid;gap:16px}
        @media(min-width:680px){.oan-charts{grid-template-columns:1fr 1fr}}

        /* conversations table */
        .oan-convs{display:flex;flex-direction:column;gap:6px}
        .oan-conv{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:11px;background:var(--c-surface-2);border:1px solid var(--c-border);transition:border-color .13s,background .13s;cursor:default}
        .oan-conv:hover{border-color:var(--c-accent);background:var(--c-accent-soft)}
        .oan-conv-ic{width:32px;height:32px;border-radius:9px;background:var(--c-org-soft);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--c-org)}
        .oan-conv-ic svg{width:13px;height:13px}
        .oan-conv-body{flex:1;min-width:0}
        .oan-conv-uid{font-size:.78rem;font-weight:600;color:var(--c-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .oan-conv-msg{font-size:.7rem;color:var(--c-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px}
        .oan-conv-meta{flex-shrink:0;text-align:right}
        .oan-conv-time{font-size:.66rem;color:var(--c-muted)}
        .oan-conv-count{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;background:var(--c-surface);border:1px solid var(--c-border);font-size:.62rem;font-weight:700;color:var(--c-muted);margin-top:3px}
        .oan-conv-count svg{width:9px;height:9px}

        /* pagination */
        .oan-pag{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
        .oan-pag-info{font-size:.72rem;color:var(--c-muted)}
        .oan-pag-btns{display:flex;gap:6px}

        /* empty */
        .oan-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:36px 20px;text-align:center}
        .oan-empty-ic{width:44px;height:44px;border-radius:12px;background:var(--c-surface-2);border:1px solid var(--c-border);display:flex;align-items:center;justify-content:center;color:var(--c-muted)}
        .oan-empty-ic svg{width:18px;height:18px}
        .oan-empty-title{font-size:.86rem;font-weight:600;color:var(--c-text)}
        .oan-empty-sub{font-size:.74rem;color:var(--c-muted)}
      `}</style>

      <div className="oan">
        {/* Metric cards */}
        <div className="oan-metrics">
          {metricCards.map(({ label, value, Icon, color }, i) => (
            <motion.div key={label} className="oan-metric"
              style={{ "--am-color": color } as any}
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * .06 }}>
              <div className="oan-metric-ic"><Icon /></div>
              <div className="oan-metric-val">{value.toLocaleString()}</div>
              <div className="oan-metric-lbl">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Usage bar */}
        {stats && (
          <motion.div className="od-card"
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.22 }}>
            <div className="od-card-title">Monthly Usage</div>
            <div className="oan-usage-wrap">
              <div className="oan-usage-head">
                <span>{stats.monthlyMessageCount} messages used</span>
                <span>{usagePct.toFixed(0)}% of {stats.monthlyMessageLimit}</span>
              </div>
              <div className="oan-usage-track">
                <div className="oan-usage-fill" style={{
                  width: `${usagePct}%`,
                  background: usagePct >= 90 ? "var(--c-danger)" : usagePct >= 70 ? "var(--c-warn)" : "var(--c-success)",
                }}/>
              </div>
            </div>
          </motion.div>
        )}

        {/* Charts */}
        <div className="oan-charts">
          <motion.div className="od-card"
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.28 }}>
            <div className="od-card-title">Daily Messages</div>
            <div className="od-card-sub">Messages handled this week.</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={mockDailyMessages} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="day" tick={{ fontSize:10, fill:"var(--c-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:"var(--c-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip/>} />
                <Bar dataKey="messages" fill="var(--c-accent)" radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div className="od-card"
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.34 }}>
            <div className="od-card-title">Conversation Growth</div>
            <div className="od-card-sub">New conversations per week.</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={mockConvGrowth}>
                <defs>
                  <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--c-org)" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="var(--c-org)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="week" tick={{ fontSize:10, fill:"var(--c-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:"var(--c-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip/>} />
                <Area type="monotone" dataKey="conversations" stroke="var(--c-org)" strokeWidth={2}
                  fill="url(#orgGrad)" dot={{ r:3, fill:"var(--c-org)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Conversations list */}
        <motion.div className="od-card"
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.38 }}>
          <div className="od-card-title">Recent Conversations</div>
          <div className="od-card-sub">Latest interactions your agent has had.</div>

          {convs.length === 0 ? (
            <div className="oan-empty">
              <div className="oan-empty-ic"><MessageSquare size={18}/></div>
              <div className="oan-empty-title">No conversations yet</div>
              <div className="oan-empty-sub">Once customers start chatting with your agent, they'll appear here.</div>
            </div>
          ) : (
            <>
              <div className="oan-convs">
                {paged.map(conv => (
                  <div key={conv.id} className="oan-conv">
                    <div className="oan-conv-ic"><MessageSquare size={13}/></div>
                    <div className="oan-conv-body">
                      <div className="oan-conv-uid">{conv.userId}</div>
                      <div className="oan-conv-msg">{conv.lastMessage}</div>
                    </div>
                    <div className="oan-conv-meta">
                      <div className="oan-conv-time">
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </div>
                      <div className="oan-conv-count">
                        <MessageSquare size={9}/> {conv.messageCount ?? "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {(hasPrev || hasMore) && (
                <div className="oan-pag">
                  <span className="oan-pag-info">
                    {convPage * PER_PAGE + 1}–{Math.min((convPage + 1) * PER_PAGE, convs.length)} of {convs.length}
                  </span>
                  <div className="oan-pag-btns">
                    <button className="od-btn od-btn--ghost" style={{ fontSize:".72rem", padding:"6px 12px" }}
                      disabled={!hasPrev} onClick={() => setConvPage(p => p - 1)}>← Prev</button>
                    <button className="od-btn od-btn--ghost" style={{ fontSize:".72rem", padding:"6px 12px" }}
                      disabled={!hasMore} onClick={() => setConvPage(p => p + 1)}>Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}