"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const TrainModelModal = dynamic(() => import("./TrainModelModal"), { ssr: false });
import { Brain, Plus, Trash2, Save, RefreshCw, CheckCircle2, AlertTriangle, FileText, MessageSquare, Globe, Upload, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Organization } from "@/types/organization/org-type";

interface QAPair { id: string; question: string; answer: string }

interface TrainingSource {
  id: string;
  type: "file" | "url";
  name: string;
  trainedAt: string;
}

interface Props {
  org: Organization;
  onSave: (updates: Partial<Organization>) => Promise<void>;
  onRefresh?: () => void;
  saving: boolean;
  saved: boolean;
  error: string;
}

export default function OrgAgent({ org, onSave, onRefresh, saving, saved, error }: Props) {
  const [agentName,   setAgentName]   = useState(org.agentName   || "");
  const [personality, setPersonality] = useState(org.agentPersonality || "");
  const [welcome,     setWelcome]     = useState(org.welcomeMessage   || "");
  const [autoReply,   setAutoReply]   = useState(org.autoReplyEnabled);
  const [qaPairs,     setQaPairs]     = useState<QAPair[]>([{ id: "1", question: "", answer: "" }]);
  const [activeSection, setActiveSection] = useState<"personality" | "qa" | "documents">("personality");
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [trainMode, setTrainMode]     = useState<"file" | "url">("file");
  const [training,  setTraining]      = useState(false);
  const [sources,   setSources]       = useState<TrainingSource[]>([]);

  useEffect(() => {
    fetch(`/api/organizations/${org.id}/training`)
      .then(r => r.json())
      .then(d => {
        if (d.ok && Array.isArray(d.qaPairs) && d.qaPairs.length > 0) {
          setQaPairs(
            (d.qaPairs as { question: string; answer: string }[]).map((p, i) => ({
              id: String(i + 1), question: p.question, answer: p.answer,
            }))
          );
        }
        if (d.ok && Array.isArray(d.sources)) setSources(d.sources);
      })
      .catch(() => {});
  }, [org.id]);

  const addPair = () => setQaPairs(p => [...p, { id: Date.now().toString(), question: "", answer: "" }]);
  const delPair = (id: string) => setQaPairs(p => p.filter(q => q.id !== id));
  const setPair = (id: string, field: "question" | "answer", val: string) =>
    setQaPairs(p => p.map(q => q.id === id ? { ...q, [field]: val } : q));

  const handleSave = async () => {
    await onSave({ agentName, agentPersonality: personality, welcomeMessage: welcome, autoReplyEnabled: autoReply });
    const validPairs = qaPairs.filter(p => p.question.trim() && p.answer.trim());
    if (validPairs.length > 0) {
      setTraining(true);
      try {
        await fetch(`/api/organizations/${org.id}/training`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qaPairs: validPairs.map(({ question, answer }) => ({ question, answer })) }),
        });
        onRefresh?.();
      } catch {} finally { setTraining(false); }
    }
  };

  const handleTrainDone = () => {
    setShowTrainModal(false);
    onRefresh?.();
    fetch(`/api/organizations/${org.id}/training`)
      .then(r => r.json())
      .then(d => { if (d.ok && Array.isArray(d.sources)) setSources(d.sources); })
      .catch(() => {});
  };

  const trained = org.knowledgeBase?.isModelTrained;

  const sections = [
    { id: "personality" as const, label: "Identity & Tone",  Icon: Brain         },
    { id: "qa"          as const, label: "Q&A Training",     Icon: MessageSquare  },
    { id: "documents"   as const, label: "Knowledge Base",   Icon: FileText       },
  ];

  return (
    <>
      <style>{`
        .oa{display:flex;flex-direction:column;gap:16px}

        .oa-status{display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:13px;border:1px solid var(--c-border)}
        .oa-status--on{background:var(--c-success-soft);border-color:color-mix(in srgb,var(--c-success) 25%,transparent)}
        .oa-status--off{background:var(--c-warn-soft);border-color:color-mix(in srgb,var(--c-warn) 25%,transparent)}
        .oa-status-ic{width:36px;height:36px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
        .oa-status--on .oa-status-ic{background:color-mix(in srgb,var(--c-success) 14%,transparent);color:var(--c-success)}
        .oa-status--off .oa-status-ic{background:color-mix(in srgb,var(--c-warn) 14%,transparent);color:var(--c-warn)}
        .oa-status-ic svg{width:16px;height:16px}
        .oa-status-title{font-size:.86rem;font-weight:700;color:var(--c-text)}
        .oa-status-sub{font-size:.7rem;color:var(--c-muted);margin-top:2px}

        .oa-sections{display:flex;gap:5px;flex-wrap:wrap}
        .oa-sec-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;border:1px solid var(--c-border);background:var(--c-surface-2);font-size:.76rem;font-weight:600;color:var(--c-muted);cursor:pointer;font-family:inherit;transition:all .13s}
        .oa-sec-btn:hover{border-color:var(--c-accent);color:var(--c-accent);background:var(--c-accent-soft)}
        .oa-sec-btn--on{background:var(--c-org-soft);border-color:var(--c-org);color:var(--c-org)}
        .oa-sec-btn svg{width:12px;height:12px}
        .oa-sec-count{background:var(--c-org);color:#fff;border-radius:20px;font-size:.55rem;font-weight:800;padding:1px 6px;margin-left:2px;line-height:1.4}

        .oa-panel{background:var(--c-surface);border:1px solid var(--c-border);border-radius:16px;padding:22px;box-shadow:var(--shadow-sm);transition:background .3s}

        .oa-qa-list{display:flex;flex-direction:column;gap:12px}
        .oa-qa-item{background:var(--c-surface-2);border:1px solid var(--c-border);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px;position:relative}
        .oa-qa-num{font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--c-muted);margin-bottom:2px}
        .oa-qa-del{position:absolute;top:10px;right:10px;display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:7px;border:1px solid var(--c-border);background:var(--c-surface);color:var(--c-muted);cursor:pointer;transition:all .13s}
        .oa-qa-del:hover{background:var(--c-danger-soft);border-color:var(--c-danger);color:var(--c-danger)}
        .oa-qa-del svg{width:11px;height:11px}
        .oa-add-btn{display:flex;align-items:center;justify-content:center;gap:7px;padding:10px;border-radius:11px;border:1.5px dashed var(--c-border);background:none;color:var(--c-muted);font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .14s;width:100%}
        .oa-add-btn:hover{border-color:var(--c-accent);color:var(--c-accent);background:var(--c-accent-soft)}
        .oa-add-btn svg{width:13px;height:13px}

        /* knowledge base */
        .oa-kb{display:flex;flex-direction:column;gap:16px}
        .oa-kb-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(max-width:480px){.oa-kb-actions{grid-template-columns:1fr}}
        .oa-kb-card{display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:16px;border-radius:14px;border:1.5px solid var(--c-border);background:var(--c-surface-2);cursor:pointer;transition:all .16s;font-family:inherit;text-align:left;width:100%}
        .oa-kb-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08)}
        .oa-kb-card--file:hover{border-color:var(--c-org);background:var(--c-org-soft)}
        .oa-kb-card--url:hover{border-color:var(--c-accent);background:var(--c-accent-soft)}
        .oa-kb-card-ic{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;transition:all .16s}
        .oa-kb-card--file .oa-kb-card-ic{background:var(--c-org-soft);color:var(--c-org)}
        .oa-kb-card--url .oa-kb-card-ic{background:var(--c-accent-soft);color:var(--c-accent)}
        .oa-kb-card-ic svg{width:16px;height:16px}
        .oa-kb-card-title{font-size:.83rem;font-weight:800;color:var(--c-text)}
        .oa-kb-card-sub{font-size:.69rem;color:var(--c-muted);line-height:1.4}

        .oa-kb-divider{font-size:.63rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--c-muted);display:flex;align-items:center;gap:8px}
        .oa-kb-divider::before,.oa-kb-divider::after{content:'';flex:1;height:1px;background:var(--c-border)}

        .oa-src-list{display:flex;flex-direction:column;gap:7px}
        .oa-src{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:11px;background:var(--c-surface-2);border:1px solid var(--c-border)}
        .oa-src-ic{width:30px;height:30px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
        .oa-src-ic--file{background:var(--c-org-soft);color:var(--c-org)}
        .oa-src-ic--url{background:var(--c-accent-soft);color:var(--c-accent)}
        .oa-src-ic svg{width:12px;height:12px}
        .oa-src-name{flex:1;font-size:.76rem;color:var(--c-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
        .oa-src-when{font-size:.64rem;color:var(--c-muted);flex-shrink:0}

        .oa-kb-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px 16px;border-radius:12px;border:1.5px dashed var(--c-border);text-align:center}
        .oa-kb-empty-ic{width:36px;height:36px;border-radius:10px;background:var(--c-org-soft);display:flex;align-items:center;justify-content:center}
        .oa-kb-empty-ic svg{width:16px;height:16px;color:var(--c-org)}
        .oa-kb-empty-title{font-size:.8rem;font-weight:700;color:var(--c-text)}
        .oa-kb-empty-sub{font-size:.7rem;color:var(--c-muted);line-height:1.5;max-width:260px}

        .oa-footer{display:flex;align-items:center;gap:8px;justify-content:flex-end;flex-wrap:wrap}
        .oa-save-note{font-size:.72rem;color:var(--c-muted);flex:1}

        .oa-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;border-radius:10px;background:var(--c-surface-2);border:1px solid var(--c-border);margin-bottom:12px}
        .oa-toggle-lbl{font-size:.82rem;font-weight:600;color:var(--c-text)}
        .oa-toggle-sub{font-size:.7rem;color:var(--c-muted);margin-top:1px}
        .oa-toggle{width:38px;height:21px;border-radius:11px;border:none;cursor:pointer;background:var(--c-border);position:relative;transition:background .2s;flex-shrink:0}
        .oa-toggle--on{background:var(--c-accent)}
        .oa-toggle-knob{position:absolute;top:3px;width:15px;height:15px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
        .oa-toggle--on .oa-toggle-knob{left:20px}
        .oa-toggle--off .oa-toggle-knob{left:3px}
      `}</style>

      <div className="oa">

        {/* Status banner */}
        <div className={`oa-status ${trained ? "oa-status--on" : "oa-status--off"}`}>
          <div className="oa-status-ic">
            {trained ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="oa-status-title">
              {org.agentName || org.name} — {trained ? "Live & Responding" : "Not Yet Trained"}
            </div>
            <div className="oa-status-sub">
              {trained
                ? `Last trained: ${org.knowledgeBase?.lastTrainedAt ? new Date(org.knowledgeBase.lastTrainedAt).toLocaleString() : "—"}`
                : "Complete the sections below and click Save & Train to activate your agent."}
            </div>
          </div>
          {trained && (
            <button className="od-btn od-btn--ghost" style={{ fontSize: ".72rem", padding: "6px 12px" }}
              onClick={handleSave} disabled={training}>
              <RefreshCw size={11}/> {training ? "Retraining…" : "Retrain"}
            </button>
          )}
        </div>

        {/* Section switcher */}
        <div className="oa-sections">
          {sections.map(({ id, label, Icon }) => (
            <button key={id} className={`oa-sec-btn ${activeSection === id ? "oa-sec-btn--on" : ""}`}
              onClick={() => setActiveSection(id)}>
              <Icon size={12}/> {label}
              {id === "documents" && sources.length > 0 && (
                <span className="oa-sec-count">{sources.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Panel */}
        <AnimatePresence mode="wait">
          <motion.div key={activeSection} className="oa-panel"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: .2 }}>

            {/* ── Identity & Tone ── */}
            {activeSection === "personality" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div className="od-card-title">Identity & Tone</div>
                  <div className="od-card-sub">Define your agent's name and how it communicates with customers.</div>
                </div>
                <div className="od-grid2">
                  <div className="od-field">
                    <label>Agent name <span>*</span></label>
                    <input className="od-input" placeholder="e.g. Aria, Max, SupportBot"
                      value={agentName} onChange={e => setAgentName(e.target.value)} />
                  </div>
                  <div className="od-field">
                    <label>Industry context</label>
                    <input className="od-input" placeholder={org.industry || "e.g. Healthcare, E-commerce"}
                      readOnly style={{ opacity: .7, cursor: "not-allowed" }} />
                  </div>
                </div>
                <div className="od-field">
                  <label>Personality & tone</label>
                  <textarea className="od-textarea" style={{ minHeight: 90 }}
                    placeholder="e.g. Friendly, concise, always polite. Use the customer's name. Never discuss competitors."
                    value={personality} onChange={e => setPersonality(e.target.value)} />
                </div>
                <div className="od-field">
                  <label>Welcome message</label>
                  <textarea className="od-textarea" style={{ minHeight: 72 }}
                    placeholder="Sent when a customer first interacts. e.g. 'Hi! I'm Aria, your Acme support agent. How can I help you today?'"
                    value={welcome} onChange={e => setWelcome(e.target.value)} />
                </div>
                <div className="oa-toggle-row">
                  <div>
                    <div className="oa-toggle-lbl">Auto-reply enabled</div>
                    <div className="oa-toggle-sub">Agent responds to all incoming messages automatically</div>
                  </div>
                  <button className={`oa-toggle ${autoReply ? "oa-toggle--on" : "oa-toggle--off"}`}
                    onClick={() => setAutoReply(v => !v)}>
                    <div className="oa-toggle-knob"/>
                  </button>
                </div>
              </div>
            )}

            {/* ── Q&A Training ── */}
            {activeSection === "qa" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div className="od-card-title">Q&A Training Pairs</div>
                  <div className="od-card-sub">
                    Add questions your customers commonly ask and the ideal answers your agent should give.
                    The more you add, the smarter your agent becomes.
                  </div>
                </div>
                <div className="oa-qa-list">
                  {qaPairs.map((pair, i) => (
                    <div key={pair.id} className="oa-qa-item">
                      <div className="oa-qa-num">Pair {i + 1}</div>
                      {qaPairs.length > 1 && (
                        <button className="oa-qa-del" onClick={() => delPair(pair.id)}>
                          <Trash2 size={11}/>
                        </button>
                      )}
                      <div className="od-field">
                        <label>Customer question</label>
                        <input className="od-input" placeholder="e.g. What are your opening hours?"
                          value={pair.question} onChange={e => setPair(pair.id, "question", e.target.value)} />
                      </div>
                      <div className="od-field">
                        <label>Agent answer</label>
                        <textarea className="od-textarea" style={{ minHeight: 68 }}
                          placeholder="e.g. We're open Monday–Friday 9am–6pm EAT. You can also reach us via email 24/7."
                          value={pair.answer} onChange={e => setPair(pair.id, "answer", e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="oa-add-btn" onClick={addPair}>
                  <Plus size={13}/> Add another Q&A pair
                </button>
              </div>
            )}

            {/* ── Knowledge Base ── */}
            {activeSection === "documents" && (
              <div className="oa-kb">
                <div>
                  <div className="od-card-title">Knowledge Base</div>
                  <div className="od-card-sub">
                    Upload files or add your website URL — your agent will study the content and use it to answer customer questions accurately.
                  </div>
                </div>

                <div className="oa-kb-actions">
                  <button className="oa-kb-card oa-kb-card--file"
                    onClick={() => { setTrainMode("file"); setShowTrainModal(true); }}>
                    <div className="oa-kb-card-ic"><Upload size={16}/></div>
                    <div>
                      <div className="oa-kb-card-title">Upload a File</div>
                      <div className="oa-kb-card-sub">PDF, Word doc, TXT or CSV</div>
                    </div>
                  </button>
                  <button className="oa-kb-card oa-kb-card--url"
                    onClick={() => { setTrainMode("url"); setShowTrainModal(true); }}>
                    <div className="oa-kb-card-ic"><Globe size={16}/></div>
                    <div>
                      <div className="oa-kb-card-title">Add a Website</div>
                      <div className="oa-kb-card-sub">Paste any public URL</div>
                    </div>
                  </button>
                </div>

                {sources.length > 0 ? (
                  <>
                    <div className="oa-kb-divider">Trained on</div>
                    <div className="oa-src-list">
                      {sources.map(src => (
                        <div key={src.id} className="oa-src">
                          <div className={`oa-src-ic oa-src-ic--${src.type}`}>
                            {src.type === "file" ? <FileText size={12}/> : <Globe size={12}/>}
                          </div>
                          <div className="oa-src-name">{src.name}</div>
                          <div className="oa-src-when">
                            {new Date(src.trainedAt).toLocaleDateString("en-RW", { month: "short", day: "numeric" })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="oa-kb-empty">
                    <div className="oa-kb-empty-ic"><Sparkles size={16}/></div>
                    <div className="oa-kb-empty-title">No knowledge sources yet</div>
                    <div className="oa-kb-empty-sub">
                      Add a file or website above to give your agent the knowledge it needs to help customers.
                    </div>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {activeSection !== "documents" && (
          <div className="oa-footer">
            <span className="oa-save-note">Saving will retrain your agent with the latest data.</span>
            {error && <span style={{ fontSize: ".74rem", color: "var(--c-danger)" }}>{error}</span>}
            <button className="od-btn od-btn--org" disabled={saving || training} onClick={handleSave}>
              {saving || training
                ? <><div className="od-spinner"/> {training ? "Training…" : "Saving…"}</>
                : saved ? <><CheckCircle2 size={13}/> Saved!</> : <><Save size={13}/> Save & Train</>}
            </button>
          </div>
        )}
      </div>

      {showTrainModal && (
        <TrainModelModal
          orgId={org.id}
          defaultTab={trainMode}
          onClose={handleTrainDone}
        />
      )}
    </>
  );
}