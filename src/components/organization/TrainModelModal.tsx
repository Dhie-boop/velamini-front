"use client";
import { useState, useRef, useEffect } from "react";

type Phase =
  | "idle"
  | "uploading"
  | "analyzing"
  | "extracting"
  | "training"
  | "done"
  | "error";

const FILE_STEPS = [
  { phase: "uploading",  label: "Uploading file…",          pct: 20 },
  { phase: "analyzing",  label: "Analysing content…",       pct: 50 },
  { phase: "extracting", label: "Extracting knowledge…",    pct: 75 },
  { phase: "training",   label: "Training your agent…",     pct: 92 },
  { phase: "done",       label: "Agent trained successfully!", pct: 100 },
];

const URL_STEPS = [
  { phase: "analyzing",  label: "Fetching website…",        pct: 25 },
  { phase: "extracting", label: "Reading page content…",    pct: 55 },
  { phase: "training",   label: "Training your agent…",     pct: 85 },
  { phase: "done",       label: "Agent trained successfully!", pct: 100 },
];

export default function TrainModelModal({
  orgId,
  defaultTab = "file",
  onClose,
  onTrained,
}: {
  orgId: string;
  defaultTab?: "file" | "url";
  onClose: () => void;
  onTrained?: () => void;
}) {
  const [tab,        setTab]        = useState<"file" | "url">(defaultTab);
  const [file,       setFile]       = useState<File | null>(null);
  const [drag,       setDrag]       = useState(false);
  const [url,        setUrl]        = useState("");
  const [phase,      setPhase]      = useState<Phase>("idle");
  const [pct,        setPct]        = useState(0);
  const [stepLabel,  setStepLabel]  = useState("");
  const [errMsg,     setErrMsg]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Animate progress bar smoothly to target
  const animateTo = (target: number, label: string, delay = 0) =>
    new Promise<void>(res => setTimeout(() => {
      setStepLabel(label);
      setPct(target);
      setTimeout(res, 800);
    }, delay));

  const runSteps = async (steps: typeof FILE_STEPS, apiFn: () => Promise<{ ok: boolean; error?: string }>) => {
    // Show first step immediately
    setPhase(steps[0].phase as Phase);
    setStepLabel(steps[0].label);
    setPct(steps[0].pct);

    // Run middle steps with delays
    for (let i = 1; i < steps.length - 1; i++) {
      await animateTo(steps[i].pct, steps[i].label, 600);
      setPhase(steps[i].phase as Phase);
    }

    // Actually call API
    const result = await apiFn();

    if (!result.ok) {
      setPhase("error");
      setErrMsg(result.error || "Something went wrong. Please try again.");
      return;
    }

    // Final step
    const last = steps[steps.length - 1];
    setPhase("training");
    await animateTo(last.pct, last.label, 400);
    setPhase("done");
    if (onTrained) onTrained();
  };

  const handleFileSubmit = async () => {
    if (!file) return;
    setPhase("uploading"); setErrMsg(""); setPct(5);

    await runSteps(FILE_STEPS, async () => {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const r = await fetch(`/api/organizations/${orgId}/train-file`, { method: "POST", body: fd });
        return await r.json();
      } catch { return { ok: false, error: "Network error." }; }
    });
  };

  const handleUrlSubmit = async () => {
    const raw = url.trim();
    if (!raw) return;
    const fullUrl = raw.startsWith("http") ? raw : `https://${raw}`;
    setPhase("analyzing"); setErrMsg(""); setPct(5);

    await runSteps(URL_STEPS, async () => {
      try {
        const r = await fetch(`/api/organizations/${orgId}/train-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: fullUrl }),
        });
        return await r.json();
      } catch { return { ok: false, error: "Network error." }; }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const isRunning = !["idle", "done", "error"].includes(phase);
  const isDone    = phase === "done";
  const isError   = phase === "error";

  // Close on backdrop click (only if not running)
  const onBg = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isRunning) onClose();
  };

  return (
    <>
      <style>{`
        /* ── Modal shell ── */
        .tm-bg{position:fixed;inset:0;background:rgba(8,20,32,.72);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;animation:tm-bg-in .2s ease}
        @keyframes tm-bg-in{from{opacity:0}to{opacity:1}}
        .tm-box{background:var(--c-surface);border:1px solid var(--c-border);border-radius:20px;width:100%;max-width:480px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.35);animation:tm-box-in .25s cubic-bezier(.34,1.56,.64,1)}
        @keyframes tm-box-in{from{opacity:0;transform:scale(.94) translateY(12px)}to{opacity:1;transform:none}}

        /* ── Header ── */
        .tm-head{padding:20px 22px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
        .tm-head-left{display:flex;align-items:center;gap:12px}
        .tm-head-icon{width:42px;height:42px;border-radius:12px;background:var(--c-org-soft);border:1px solid color-mix(in srgb,var(--c-org) 20%,transparent);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .tm-head-icon svg{width:18px;height:18px;color:var(--c-org)}
        .tm-title{font-family:'DM Serif Display',serif;font-size:1.12rem;color:var(--c-text);font-weight:400}
        .tm-sub{font-size:.72rem;color:var(--c-muted);margin-top:2px}
        .tm-x{width:32px;height:32px;border-radius:8px;border:1px solid var(--c-border);background:var(--c-surface-2);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .13s;font-size:1rem;color:var(--c-muted);flex-shrink:0}
        .tm-x:hover{background:var(--c-danger-soft);border-color:var(--c-danger);color:var(--c-danger)}

        /* ── Tabs ── */
        .tm-tabs{display:flex;gap:6px;padding:16px 22px 0}
        .tm-tab{flex:1;padding:8px 0;border-radius:9px;border:1.5px solid var(--c-border);background:var(--c-surface-2);font-size:.78rem;font-weight:700;color:var(--c-muted);cursor:pointer;font-family:inherit;transition:all .14s;display:flex;align-items:center;justify-content:center;gap:6px}
        .tm-tab svg{width:12px;height:12px}
        .tm-tab:hover{border-color:var(--c-accent);color:var(--c-accent);background:var(--c-accent-soft)}
        .tm-tab--on{background:var(--c-org-soft);border-color:var(--c-org);color:var(--c-org)}

        /* ── Body ── */
        .tm-body{padding:18px 22px 22px;display:flex;flex-direction:column;gap:14px}

        /* ── Drop zone ── */
        .tm-drop{border:2px dashed var(--c-border);border-radius:14px;padding:30px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer;transition:all .15s;background:none;width:100%;font-family:inherit}
        .tm-drop:hover,.tm-drop--over{border-color:var(--c-accent);background:var(--c-accent-soft)}
        .tm-drop-ic{width:44px;height:44px;border-radius:12px;background:var(--c-surface-2);border:1px solid var(--c-border);display:flex;align-items:center;justify-content:center;transition:all .15s}
        .tm-drop:hover .tm-drop-ic,.tm-drop--over .tm-drop-ic{background:var(--c-accent-soft);border-color:var(--c-accent)}
        .tm-drop-ic svg{width:18px;height:18px;color:var(--c-accent)}
        .tm-drop-title{font-size:.84rem;font-weight:700;color:var(--c-text)}
        .tm-drop-sub{font-size:.7rem;color:var(--c-muted);line-height:1.5;text-align:center}
        .tm-drop-types{display:flex;gap:5px;flex-wrap:wrap;justify-content:center;margin-top:2px}
        .tm-type{padding:2px 8px;border-radius:5px;background:var(--c-surface-2);border:1px solid var(--c-border);font-size:.6rem;font-weight:800;color:var(--c-muted);text-transform:uppercase;letter-spacing:.07em}

        /* ── Chosen file chip ── */
        .tm-file-chip{display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:10px;background:var(--c-org-soft);border:1px solid color-mix(in srgb,var(--c-org) 22%,transparent)}
        .tm-file-chip-ic{width:28px;height:28px;border-radius:7px;background:var(--c-org);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .tm-file-chip-ic svg{width:13px;height:13px;color:#fff}
        .tm-file-name{flex:1;font-size:.8rem;font-weight:600;color:var(--c-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .tm-file-size{font-size:.68rem;color:var(--c-muted);flex-shrink:0}
        .tm-file-rm{width:22px;height:22px;border-radius:6px;border:1px solid var(--c-border);background:var(--c-surface);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .13s;flex-shrink:0}
        .tm-file-rm:hover{background:var(--c-danger-soft);border-color:var(--c-danger);color:var(--c-danger)}
        .tm-file-rm svg{width:10px;height:10px}

        /* ── URL input ── */
        .tm-url-wrap{position:relative}
        .tm-url-ic{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--c-muted);pointer-events:none}
        .tm-url-ic svg{width:14px;height:14px}
        .tm-url-in{width:100%;padding:11px 12px 11px 36px;border-radius:11px;border:1.5px solid var(--c-border);background:var(--c-surface-2);color:var(--c-text);font-size:.84rem;font-family:ui-monospace,monospace;outline:none;transition:border-color .14s}
        .tm-url-in:focus{border-color:var(--c-accent);background:var(--c-surface)}
        .tm-url-in::placeholder{color:var(--c-muted);opacity:.6;font-family:inherit}

        /* ── Progress section ── */
        .tm-progress{display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:14px;background:var(--c-surface-2);border:1px solid var(--c-border)}
        .tm-progress-top{display:flex;align-items:center;gap:10px}
        .tm-progress-label{font-size:.82rem;font-weight:600;color:var(--c-text);flex:1}
        .tm-progress-pct{font-size:.72rem;font-weight:800;color:var(--c-accent);font-variant-numeric:tabular-nums}
        .tm-bar-track{height:6px;border-radius:3px;background:var(--c-border);overflow:hidden}
        .tm-bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--c-org),var(--c-accent));transition:width .8s cubic-bezier(.4,0,.2,1)}
        .tm-steps{display:flex;flex-direction:column;gap:5px;margin-top:4px}
        .tm-step{display:flex;align-items:center;gap:8px;font-size:.71rem}
        .tm-step-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
        .tm-step--done .tm-step-dot{background:var(--c-success)}
        .tm-step--active .tm-step-dot{background:var(--c-accent);animation:tm-pulse 1.2s ease infinite}
        .tm-step--wait .tm-step-dot{background:var(--c-border)}
        .tm-step--done .tm-step-txt{color:var(--c-success)}
        .tm-step--active .tm-step-txt{color:var(--c-accent);font-weight:600}
        .tm-step--wait .tm-step-txt{color:var(--c-muted)}
        @keyframes tm-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}

        /* ── Done state ── */
        .tm-done{display:flex;flex-direction:column;align-items:center;gap:10px;padding:20px 16px;text-align:center}
        .tm-done-ic{width:52px;height:52px;border-radius:50%;background:var(--c-success-soft);border:2px solid color-mix(in srgb,var(--c-success) 30%,transparent);display:flex;align-items:center;justify-content:center;animation:tm-pop .4s cubic-bezier(.34,1.56,.64,1)}
        @keyframes tm-pop{from{transform:scale(0)}to{transform:scale(1)}}
        .tm-done-ic svg{width:22px;height:22px;color:var(--c-success)}
        .tm-done-title{font-family:'DM Serif Display',serif;font-size:1.05rem;color:var(--c-text)}
        .tm-done-sub{font-size:.74rem;color:var(--c-muted);line-height:1.5}

        /* ── Error state ── */
        .tm-err{display:flex;align-items:flex-start;gap:8px;padding:11px 13px;border-radius:10px;background:var(--c-danger-soft);border:1px solid color-mix(in srgb,var(--c-danger) 25%,transparent);font-size:.76rem;color:var(--c-danger);line-height:1.5}
        .tm-err svg{width:13px;height:13px;flex-shrink:0;margin-top:1px}

        /* ── Footer ── */
        .tm-foot{padding:0 22px 20px;display:flex;gap:8px;justify-content:flex-end}
        .tm-cta{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:10px;font-size:.8rem;font-weight:800;font-family:inherit;cursor:pointer;border:none;transition:all .15s}
        .tm-cta--primary{background:var(--c-org);color:#fff}
        .tm-cta--primary:hover:not(:disabled){background:color-mix(in srgb,var(--c-org) 82%,black);transform:translateY(-1px)}
        .tm-cta--ghost{background:var(--c-surface-2);border:1px solid var(--c-border);color:var(--c-muted)}
        .tm-cta--ghost:hover{border-color:var(--c-accent);color:var(--c-accent)}
        .tm-cta:disabled{opacity:.45;cursor:not-allowed;transform:none!important}
        .tm-cta svg{width:13px;height:13px}

        /* ── Spinner ── */
        @keyframes tm-spin{to{transform:rotate(360deg)}}
        .tm-spin{animation:tm-spin .75s linear infinite}

        /* ── File size helper ── */
      `}</style>

      <div className="tm-bg" onClick={onBg}>
        <div className="tm-box">

          {/* Header */}
          <div className="tm-head">
            <div className="tm-head-left">
              <div className="tm-head-icon">
                {tab === "file"
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                }
              </div>
              <div>
                <div className="tm-title">Train Your Agent</div>
                <div className="tm-sub">Add a file or website to build your agent's knowledge</div>
              </div>
            </div>
            <button className="tm-x" onClick={onClose} disabled={isRunning}>
              ×
            </button>
          </div>

          {/* Tabs — hide during progress */}
          {!isRunning && !isDone && (
            <div className="tm-tabs">
              <button
                className={`tm-tab ${tab === "file" ? "tm-tab--on" : ""}`}
                onClick={() => { setTab("file"); setErrMsg(""); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Upload File
              </button>
              <button
                className={`tm-tab ${tab === "url" ? "tm-tab--on" : ""}`}
                onClick={() => { setTab("url"); setErrMsg(""); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Website URL
              </button>
            </div>
          )}

          <div className="tm-body">

            {/* ── PROGRESS ── */}
            {(isRunning || isDone) && !isError && (
              <>
                {isDone ? (
                  <div className="tm-done">
                    <div className="tm-done-ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div className="tm-done-title">Agent trained successfully!</div>
                    <div className="tm-done-sub">
                      Your agent has absorbed the new knowledge and is ready to answer customer questions.
                    </div>
                  </div>
                ) : (
                  <div className="tm-progress">
                    <div className="tm-progress-top">
                      <div className="tm-progress-label">{stepLabel}</div>
                      <div className="tm-progress-pct">{pct}%</div>
                    </div>
                    <div className="tm-bar-track">
                      <div className="tm-bar-fill" style={{ width: `${pct}%` }}/>
                    </div>
                    <div className="tm-steps">
                      {(tab === "file" ? FILE_STEPS : URL_STEPS).slice(0, -1).map(s => {
                        const status = s.pct < pct ? "done" : s.phase === phase ? "active" : "wait";
                        return (
                          <div key={s.phase} className={`tm-step tm-step--${status}`}>
                            <div className="tm-step-dot"/>
                            <span className="tm-step-txt">{s.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── ERROR ── */}
            {isError && (
              <div className="tm-err">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errMsg}
              </div>
            )}

            {/* ── FILE TAB (idle / error) ── */}
            {!isRunning && !isDone && tab === "file" && (
              <>
                <input
                  type="file"
                  ref={fileRef}
                  style={{ display: "none" }}
                  accept=".pdf,.doc,.docx,.txt,.csv"
                  onChange={e => { setFile(e.target.files?.[0] || null); setErrMsg(""); }}
                />

                {!file ? (
                  <button
                    className={`tm-drop ${drag ? "tm-drop--over" : ""}`}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={handleDrop}
                  >
                    <div className="tm-drop-ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                    </div>
                    <div className="tm-drop-title">Drop your file here or click to browse</div>
                    <div className="tm-drop-sub">Your agent will read and learn from the contents</div>
                    <div className="tm-drop-types">
                      {["PDF", "DOCX", "TXT", "CSV"].map(t => <span key={t} className="tm-type">{t}</span>)}
                    </div>
                  </button>
                ) : (
                  <div className="tm-file-chip">
                    <div className="tm-file-chip-ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div className="tm-file-name">{file.name}</div>
                    <div className="tm-file-size">{(file.size / 1024).toFixed(0)} KB</div>
                    <button className="tm-file-rm" onClick={() => setFile(null)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── URL TAB (idle / error) ── */}
            {!isRunning && !isDone && tab === "url" && (
              <div className="tm-url-wrap">
                <div className="tm-url-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <input
                  className="tm-url-in"
                  placeholder="https://yourwebsite.com"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setErrMsg(""); }}
                  onKeyDown={e => e.key === "Enter" && handleUrlSubmit()}
                />
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="tm-foot">
            {isDone ? (
              <button className="tm-cta tm-cta--primary" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Done
              </button>
            ) : isError ? (
              <>
                <button className="tm-cta tm-cta--ghost" onClick={() => { setPhase("idle"); setErrMsg(""); setPct(0); }}>
                  Try Again
                </button>
                <button className="tm-cta tm-cta--ghost" onClick={onClose}>Cancel</button>
              </>
            ) : (
              <>
                <button className="tm-cta tm-cta--ghost" onClick={onClose} disabled={isRunning}>
                  Cancel
                </button>
                <button
                  className="tm-cta tm-cta--primary"
                  disabled={isRunning || (tab === "file" ? !file : !url.trim())}
                  onClick={tab === "file" ? handleFileSubmit : handleUrlSubmit}
                >
                  {isRunning
                    ? <><svg className="tm-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Training…</>
                    : tab === "file"
                      ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg> Upload & Train</>
                      : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Analyse & Train</>
                  }
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}