"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert, CheckCircle, XCircle, Eye, MessageSquare, User,
  AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Trash2, Ban,
} from "lucide-react";

type Severity     = "high" | "medium" | "low";
type ReportStatus = "pending" | "resolved" | "dismissed";
type ReportType   = "message" | "profile" | "content" | "feedback";

interface TargetUser { id: string; name: string | null; email: string | null; image: string | null; status: string }
interface Report {
  id:           string;
  type:         ReportType;
  severity:     Severity;
  status:       ReportStatus;
  reason:       string;
  excerpt:      string | null;
  reporter:     string | null;
  target:       string | null;
  targetUserId: string | null;
  targetUser:   TargetUser | null;
  resolvedBy:   string | null;
  resolvedAt:   string | null;
  createdAt:    string;
}

const PAGE_SIZE = 15;

const typeIcon: Record<ReportType, any> = {
  message:  MessageSquare,
  profile:  User,
  content:  AlertTriangle,
  feedback: Eye,
};

const severityClass: Record<Severity, string> = {
  high: "am-sev--high", medium: "am-sev--med", low: "am-sev--low",
};
const statusClass: Record<ReportStatus, string> = {
  pending: "am-st--pending", resolved: "am-st--resolved", dismissed: "am-st--dismissed",
};

function timeAgo(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminModeration() {
  const [reports,    setReports]   = useState<Report[]>([]);
  const [total,      setTotal]     = useState(0);
  const [pages,      setPages]     = useState(1);
  const [pending,    setPending]   = useState(0);
  const [page,       setPage]      = useState(1);
  const [loading,    setLoading]   = useState(true);
  const [actioning,  setActioning] = useState<string | null>(null);
  const [filter,     setFilter]    = useState<ReportStatus | "all">("pending");
  const [expanded,   setExp]       = useState<string | null>(null);

  const fetchReports = useCallback((status: string, p: number) => {
    setLoading(true);
    const q = new URLSearchParams({ status, page: String(p), pageSize: String(PAGE_SIZE) });
    fetch(`/api/admin/moderation?${q}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setReports(d.reports);
          setTotal(d.total);
          setPages(d.pages);
          setPending(d.pending);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => fetchReports(filter, page), 0);
    return () => clearTimeout(id);
  }, [filter, page, fetchReports]);

  // When filter changes, reset to page 1
  const changeFilter = (f: ReportStatus | "all") => { setFilter(f); setPage(1); };

  const updateStatus = async (id: string, status: ReportStatus) => {
    setActioning(id);
    const res = await fetch(`/api/admin/moderation/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    }).then(r => r.json());
    if (res.ok) {
      setReports(p => p.map(r => r.id === id ? { ...r, status, resolvedAt: res.report.resolvedAt, resolvedBy: res.report.resolvedBy } : r));
      setExp(null);
      // Update pending count
      if (status !== "pending") setPending(c => Math.max(0, c - 1));
    }
    setActioning(null);
  };

  const banUser = async (report: Report) => {
    if (!report.targetUserId) return;
    setActioning(report.id);
    const res = await fetch(`/api/admin/users/${report.targetUserId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "banned" }),
    }).then(r => r.json());
    if (res.ok) {
      // auto-resolve the report too
      await updateStatus(report.id, "resolved");
    }
    setActioning(null);
  };

  const deleteReport = async (id: string) => {
    setActioning(id);
    await fetch(`/api/admin/moderation/${id}`, { method: "DELETE" });
    setReports(p => p.filter(r => r.id !== id));
    setTotal(c => c - 1);
    setExp(null);
    setActioning(null);
  };

  return (
    <>
      <style>{`
        .am{padding:18px 14px 48px;background:var(--c-bg);min-height:100%;transition:background .3s}
        @media(min-width:600px){.am{padding:26px 24px 56px}}
        @media(min-width:1024px){.am{padding:32px 36px 64px}}
        .am-inner{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:20px}

        .am-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}
        .am-title{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(1.5rem,4vw,2rem);font-weight:400;letter-spacing:-.022em;color:var(--c-text);margin-bottom:4px}
        .am-sub{font-size:.8rem;color:var(--c-muted)}
        .am-count{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;background:var(--c-danger-soft);border:1px solid color-mix(in srgb,var(--c-danger) 25%,transparent);font-size:.68rem;font-weight:700;color:var(--c-danger);flex-shrink:0}

        .am-toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
        .am-filters{display:flex;gap:5px;flex-wrap:wrap}
        .am-filter{padding:6px 13px;border-radius:8px;border:1px solid var(--c-border);background:var(--c-surface-2);color:var(--c-muted);font-size:.74rem;font-weight:600;cursor:pointer;transition:all .13s;font-family:inherit}
        .am-filter:hover{border-color:var(--c-accent);color:var(--c-accent)}
        .am-filter--on{background:var(--c-accent-soft);border-color:var(--c-accent);color:var(--c-accent)}
        .am-refresh{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1px solid var(--c-border);background:var(--c-surface-2);color:var(--c-muted);font-size:.74rem;font-weight:600;cursor:pointer;transition:all .13s;font-family:inherit}
        .am-refresh:hover{border-color:var(--c-accent);color:var(--c-accent)}
        .am-refresh svg{width:12px;height:12px}
        .am-refresh--spin svg{animation:am-spin .7s linear infinite}
        @keyframes am-spin{to{transform:rotate(360deg)}}

        .am-list{display:flex;flex-direction:column;gap:10px}

        .am-report{background:var(--c-surface);border:1px solid var(--c-border);border-radius:14px;overflow:hidden;box-shadow:var(--shadow-sm);transition:background .3s,border-color .3s}
        .am-report--high{border-left:3px solid var(--c-danger)}
        .am-report--medium{border-left:3px solid var(--c-warn)}
        .am-report--low{border-left:3px solid var(--c-muted)}

        .am-report-head{display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;transition:background .13s}
        .am-report-head:hover{background:var(--c-surface-2)}

        .am-type-ic{width:32px;height:32px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--c-surface-2);color:var(--c-muted)}
        .am-type-ic svg{width:14px;height:14px}
        .am-report-head:hover .am-type-ic{background:var(--c-accent-soft);color:var(--c-accent)}

        .am-rinfo{flex:1;min-width:0}
        .am-rtarget{font-size:.82rem;font-weight:700;color:var(--c-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .am-rreason{font-size:.7rem;color:var(--c-muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

        .am-rmeta{display:flex;align-items:center;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end}
        .am-sev{font-size:.62rem;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:.04em}
        .am-sev--high{background:var(--c-danger-soft);color:var(--c-danger)}
        .am-sev--med{background:var(--c-warn-soft);color:var(--c-warn)}
        .am-sev--low{background:var(--c-surface-2);color:var(--c-muted)}
        .am-st{font-size:.62rem;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:.04em}
        .am-st--pending{background:var(--c-warn-soft);color:var(--c-warn)}
        .am-st--resolved{background:var(--c-success-soft);color:var(--c-success)}
        .am-st--dismissed{background:var(--c-surface-2);color:var(--c-muted)}
        .am-rtime{font-size:.68rem;color:var(--c-muted);white-space:nowrap}

        .am-report-body{padding:0 16px 14px;border-top:1px solid var(--c-border);background:var(--c-surface-2)}
        .am-excerpt{font-size:.8rem;color:var(--c-muted);font-style:italic;line-height:1.6;padding:10px 0 12px;border-bottom:1px solid var(--c-border)}
        .am-meta-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap;font-size:.7rem;color:var(--c-muted);margin:8px 0 12px}
        .am-meta-row strong{color:var(--c-text)}
        .am-resolved-note{font-size:.68rem;color:var(--c-success);margin-bottom:8px}
        .am-actions{display:flex;gap:7px;flex-wrap:wrap}
        .am-action-btn{display:flex;align-items:center;gap:5px;padding:7px 13px;border-radius:9px;border:1px solid var(--c-border);background:var(--c-surface);font-size:.76rem;font-weight:600;cursor:pointer;transition:all .14s;font-family:inherit;color:var(--c-muted)}
        .am-action-btn:disabled{opacity:.5;cursor:not-allowed}
        .am-action-btn:hover:not(:disabled){border-color:var(--c-accent);color:var(--c-accent);background:var(--c-accent-soft)}
        .am-action-btn--resolve:hover:not(:disabled){border-color:var(--c-success);color:var(--c-success);background:var(--c-success-soft)}
        .am-action-btn--dismiss:hover:not(:disabled){border-color:var(--c-muted);color:var(--c-text);background:var(--c-surface-2)}
        .am-action-btn--ban:hover:not(:disabled){border-color:var(--c-danger);color:var(--c-danger);background:var(--c-danger-soft)}
        .am-action-btn--del:hover:not(:disabled){border-color:var(--c-danger);color:var(--c-danger);background:var(--c-danger-soft)}
        .am-action-btn svg{width:12px;height:12px}

        /* skeleton */
        .am-skel{height:62px;background:linear-gradient(90deg,var(--c-surface) 25%,var(--c-surface-2) 50%,var(--c-surface) 75%);background-size:200% 100%;animation:am-sk 1.4s ease infinite;border-radius:14px;border:1px solid var(--c-border)}
        @keyframes am-sk{0%{background-position:200% 0}100%{background-position:-200% 0}}

        .am-empty{text-align:center;padding:48px 20px;color:var(--c-muted);font-size:.84rem}
        .am-empty-ic{display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:14px;background:var(--c-surface-2);margin:0 auto 12px;color:var(--c-muted)}

        /* pagination */
        .am-pager{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:4px 0}
        .am-pager-info{font-size:.73rem;color:var(--c-muted)}
        .am-pager-btns{display:flex;align-items:center;gap:6px}
        .am-pbtn{display:flex;align-items:center;justify-content:center;gap:5px;padding:0 14px;height:32px;border-radius:8px;border:1px solid var(--c-border);background:var(--c-surface);color:var(--c-muted);cursor:pointer;transition:all .13s;font-size:.78rem;font-weight:600;font-family:inherit;white-space:nowrap}
        .am-pbtn:hover:not(:disabled){border-color:var(--c-accent);color:var(--c-accent);background:color-mix(in srgb,var(--c-accent) 8%,transparent)}
        .am-pbtn:disabled{opacity:.35;cursor:not-allowed}
        .am-pbtn svg{width:13px;height:13px}
        .am-pnum-page{display:flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:8px;padding:0 4px;border:1px solid var(--c-border);background:var(--c-surface);color:var(--c-muted);cursor:pointer;font-size:.78rem;font-weight:600;transition:all .13s}
        .am-pnum-page:hover{border-color:var(--c-accent);color:var(--c-accent);background:color-mix(in srgb,var(--c-accent) 8%,transparent)}
        .am-pnum-page.active{background:var(--c-text);color:var(--c-surface);border-color:var(--c-text);cursor:default}
        .am-pnum-ellipsis{font-size:.78rem;color:var(--c-muted);padding:0 2px;line-height:32px}
      `}</style>

      <div className="am">
        <div className="am-inner">
          {/* Header */}
          <div className="am-hd">
            <div>
              <h1 className="am-title">Content Moderation</h1>
              <p className="am-sub">Review and act on reported users and content.</p>
            </div>
            {pending > 0 && (
              <div className="am-count"><ShieldAlert size={12} /> {pending} pending</div>
            )}
          </div>

          {/* Toolbar */}
          <div className="am-toolbar">
            <div className="am-filters">
              {(["pending","resolved","dismissed","all"] as const).map(f => (
                <button key={f} className={`am-filter ${filter === f ? "am-filter--on" : ""}`}
                  onClick={() => changeFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <button className={`am-refresh ${loading ? "am-refresh--spin" : ""}`}
              onClick={() => fetchReports(filter, page)} disabled={loading}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {/* List */}
          <div className="am-list">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="am-skel" />)
            ) : reports.length === 0 ? (
              <div className="am-empty">
                <div className="am-empty-ic"><ShieldAlert size={20} /></div>
                No {filter === "all" ? "" : filter} reports found.
              </div>
            ) : reports.map(r => {
              const TypeIcon  = typeIcon[r.type] ?? ShieldAlert;
              const isBusy    = actioning === r.id;
              const displayTarget = r.targetUser?.name ?? r.targetUser?.email ?? r.target ?? "Unknown";
              return (
                <div key={r.id} className={`am-report am-report--${r.severity}`}>
                  <div className="am-report-head" onClick={() => setExp(expanded === r.id ? null : r.id)}>
                    <div className="am-type-ic"><TypeIcon /></div>
                    <div className="am-rinfo">
                      <div className="am-rtarget">{displayTarget}</div>
                      <div className="am-rreason">{r.reason}</div>
                    </div>
                    <div className="am-rmeta">
                      <span className={`am-sev ${severityClass[r.severity]}`}>{r.severity}</span>
                      <span className={`am-st ${statusClass[r.status]}`}>{r.status}</span>
                      <span className="am-rtime">{timeAgo(r.createdAt)}</span>
                    </div>
                  </div>

                  {expanded === r.id && (
                    <div className="am-report-body">
                      {r.excerpt && (
                        <div className="am-excerpt">"{r.excerpt}"</div>
                      )}
                      <div className="am-meta-row">
                        {r.reporter && <span>Reported by <strong>{r.reporter}</strong></span>}
                        {r.targetUser?.email && <span>Target email: <strong>{r.targetUser.email}</strong></span>}
                        {r.targetUser?.status && (
                          <span>Account status: <strong style={{ textTransform:"capitalize" }}>{r.targetUser.status}</strong></span>
                        )}
                        <span>Type: <strong style={{ textTransform:"capitalize" }}>{r.type}</strong></span>
                      </div>
                      {r.resolvedBy && (
                        <div className="am-resolved-note">
                          <CheckCircle size={10} style={{ display:"inline", marginRight:4 }}/>
                          {r.status} by {r.resolvedBy}
                          {r.resolvedAt ? ` · ${timeAgo(r.resolvedAt)}` : ""}
                        </div>
                      )}
                      <div className="am-actions">
                        {r.status === "pending" && (
                          <>
                            <button className="am-action-btn am-action-btn--resolve" disabled={isBusy}
                              onClick={() => updateStatus(r.id, "resolved")}>
                              <CheckCircle size={12} /> Resolve
                            </button>
                            <button className="am-action-btn am-action-btn--dismiss" disabled={isBusy}
                              onClick={() => updateStatus(r.id, "dismissed")}>
                              <XCircle size={12} /> Dismiss
                            </button>
                            {r.targetUserId && r.targetUser?.status !== "banned" && (
                              <button className="am-action-btn am-action-btn--ban" disabled={isBusy}
                                onClick={() => banUser(r)}>
                                <Ban size={12} /> Ban User
                              </button>
                            )}
                          </>
                        )}
                        {r.status !== "pending" && (
                          <button className="am-action-btn" disabled={isBusy}
                            onClick={() => updateStatus(r.id, "pending")}>
                            <RefreshCw size={12} /> Reopen
                          </button>
                        )}
                        <button className="am-action-btn am-action-btn--del" disabled={isBusy}
                          onClick={() => deleteReport(r.id)}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="am-pager">
              <span className="am-pager-info">
                Showing {Math.min((page-1)*PAGE_SIZE+1, total)}–{Math.min(page*PAGE_SIZE, total)} of {total.toLocaleString()}
              </span>
              <div className="am-pager-btns">
                <button className="am-pbtn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={13} /> Back
                </button>
                {(() => {
                  const delta = 1;
                  const range: (number | "…")[] = [];
                  range.push(1);
                  if (page - delta > 2) range.push("…");
                  for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) range.push(i);
                  if (page + delta < pages - 1) range.push("…");
                  if (pages > 1) range.push(pages);
                  return range.map((item, i) =>
                    item === "…"
                      ? <span key={`e${i}`} className="am-pnum-ellipsis">…</span>
                      : <button key={item} className={`am-pnum-page${page === item ? " active" : ""}`}
                          onClick={() => page !== item && setPage(item as number)}>
                          {item}
                        </button>
                  );
                })()}
                <button className="am-pbtn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}