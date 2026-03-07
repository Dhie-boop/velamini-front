"use client";

import { useState } from "react";
import { Save, CheckCircle2, AlertCircle, Clock, Globe, Mail, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Organization } from "@/types/organization/org-type";

interface Props {
  org: Organization;
  onSave: (updates: Partial<Organization>) => Promise<void>;
  saving: boolean;
  saved: boolean;
  error: string;
}

const timezones = [
  "Africa/Kigali","Africa/Nairobi","Africa/Lagos","Africa/Johannesburg",
  "Africa/Cairo","Europe/London","Europe/Paris","America/New_York",
  "America/Los_Angeles","Asia/Dubai","Asia/Singapore","Asia/Tokyo",
];

const industries = [
  "E-commerce","Healthcare","Education","Finance","Technology",
  "Hospitality","Real Estate","Retail","Food & Beverage","Other",
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width:40, height:22, borderRadius:11, border:"none", cursor:"pointer",
        background: on ? "var(--c-accent)" : "var(--c-border)",
        position:"relative", transition:"background .2s", flexShrink:0,
      }}>
      <span style={{
        position:"absolute", top:3,
        left: on ? 21 : 3,
        width:16, height:16, borderRadius:"50%",
        background:"#fff", transition:"left .2s",
        boxShadow:"0 1px 3px rgba(0,0,0,.2)",
      }}/>
    </button>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <motion.div className="od-card"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
      <div className="od-card-title">{title}</div>
      {sub && <div className="od-card-sub">{sub}</div>}
      {children}
    </motion.div>
  );
}

export default function OrgSettings({ org, onSave, saving, saved, error }: Props) {
  // general
  const [name,        setName]        = useState(org.name);
  const [desc,        setDesc]        = useState(org.description    || "");
  const [website,     setWebsite]     = useState(org.website        || "");
  const [email,       setEmail]       = useState(org.contactEmail   || "");
  const [industry,    setIndustry]    = useState(org.industry       || "");
  // agent
  const [agentName,   setAgentName]   = useState(org.agentName      || "");
  const [personality, setPersonality] = useState(org.agentPersonality || "");
  const [welcome,     setWelcome]     = useState(org.welcomeMessage  || "");
  const [autoReply,   setAutoReply]   = useState(org.autoReplyEnabled);
  // hours
  const [hoursOn,     setHoursOn]     = useState(org.businessHoursEnabled);
  const [start,       setStart]       = useState(org.businessHoursStart || "09:00");
  const [end,         setEnd]         = useState(org.businessHoursEnd   || "17:00");
  const [timezone,    setTimezone]    = useState(org.timezone           || "Africa/Kigali");

  const handleSave = () => onSave({
    name, description: desc, website, contactEmail: email, industry,
    agentName, agentPersonality: personality, welcomeMessage: welcome,
    autoReplyEnabled: autoReply,
    businessHoursEnabled: hoursOn, businessHoursStart: start,
    businessHoursEnd: end, timezone,
  });

  return (
    <>
      <style>{`
        .os{display:flex;flex-direction:column;gap:16px}
        .os-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:11px;background:var(--c-surface-2);border:1px solid var(--c-border);margin-bottom:10px}
        .os-toggle-lbl{font-size:.84rem;font-weight:600;color:var(--c-text)}
        .os-toggle-sub{font-size:.7rem;color:var(--c-muted);margin-top:2px;line-height:1.4}
        .os-hours-grid{display:grid;gap:12px;grid-template-columns:1fr 1fr}
        @media(max-width:460px){.os-hours-grid{grid-template-columns:1fr}}
        .os-section-icon{display:flex;align-items:center;gap:7px;margin-bottom:14px;font-size:.74rem;font-weight:700;letter-spacing:.04em;color:var(--c-muted);text-transform:uppercase}
        .os-section-icon svg{width:13px;height:13px;color:var(--c-org)}
        .os-footer{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding-top:4px}
        .os-saved{font-size:.76rem;color:var(--c-success);display:flex;align-items:center;gap:5px}
        .os-saved svg{width:13px;height:13px}
        .os-err{font-size:.74rem;color:var(--c-danger);display:flex;align-items:center;gap:5px}
        .os-err svg{width:13px;height:13px}
      `}</style>

      <div className="os">

        {/* General */}
        <Section title="General" sub="Basic information about your organisation.">
          <div className="os-section-icon"><Building2 size={13}/> Organisation info</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div className="od-grid2">
              <div className="od-field">
                <label>Name <span>*</span></label>
                <input className="od-input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="od-field">
                <label>Industry</label>
                <select className="od-select" value={industry} onChange={e => setIndustry(e.target.value)}>
                  <option value="">Select…</option>
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div className="od-field">
              <label>Description</label>
              <textarea className="od-textarea" value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="A short description of what your organisation does." />
            </div>
            <div className="od-grid2">
              <div className="od-field">
                <label><Globe size={9} style={{ display:"inline", marginRight:3 }}/>Website</label>
                <input className="od-input" placeholder="https://example.com" value={website} onChange={e => setWebsite(e.target.value)} />
              </div>
              <div className="od-field">
                <label><Mail size={9} style={{ display:"inline", marginRight:3 }}/>Contact email</label>
                <input className="od-input" type="email" placeholder="hello@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
          </div>
        </Section>

        {/* Agent */}
        <Section title="Agent" sub="Control how your AI agent presents itself to customers.">
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div className="od-field">
              <label>Agent name</label>
              <input className="od-input" placeholder="e.g. Aria" value={agentName} onChange={e => setAgentName(e.target.value)} />
            </div>
            <div className="od-field">
              <label>Personality & tone</label>
              <textarea className="od-textarea" style={{ minHeight:80 }}
                placeholder="e.g. Friendly, professional, concise. Use the customer's first name."
                value={personality} onChange={e => setPersonality(e.target.value)} />
            </div>
            <div className="od-field">
              <label>Welcome message</label>
              <textarea className="od-textarea" style={{ minHeight:68 }}
                placeholder="e.g. Hi! I'm Aria. How can I help you today?"
                value={welcome} onChange={e => setWelcome(e.target.value)} />
            </div>
            <div className="os-toggle-row">
              <div>
                <div className="os-toggle-lbl">Auto-reply</div>
                <div className="os-toggle-sub">Agent responds to all messages automatically</div>
              </div>
              <Toggle on={autoReply} onChange={setAutoReply} />
            </div>
          </div>
        </Section>

        {/* Business hours */}
        <Section title="Business Hours" sub="Restrict agent replies to certain hours of the day.">
          <div className="os-toggle-row">
            <div>
              <div className="os-toggle-lbl"><Clock size={11} style={{ display:"inline", marginRight:4 }}/>Enable business hours</div>
              <div className="os-toggle-sub">Agent only replies during the hours below</div>
            </div>
            <Toggle on={hoursOn} onChange={setHoursOn} />
          </div>

          {hoursOn && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div className="os-hours-grid">
                <div className="od-field">
                  <label>Start time</label>
                  <input type="time" className="od-input" value={start} onChange={e => setStart(e.target.value)} />
                </div>
                <div className="od-field">
                  <label>End time</label>
                  <input type="time" className="od-input" value={end} onChange={e => setEnd(e.target.value)} />
                </div>
              </div>
              <div className="od-field">
                <label>Timezone</label>
                <select className="od-select" value={timezone} onChange={e => setTimezone(e.target.value)}>
                  {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>
          )}
        </Section>

        {/* Save footer */}
        <div className="os-footer">
          {saved && (
            <span className="os-saved"><CheckCircle2 size={13}/> Saved successfully</span>
          )}
          {error && (
            <span className="os-err"><AlertCircle size={13}/> {error}</span>
          )}
          <button className="od-btn od-btn--primary" disabled={saving} onClick={handleSave}>
            {saving ? <><div className="od-spinner"/> Saving…</> : <><Save size={13}/> Save changes</>}
          </button>
        </div>

      </div>
    </>
  );
}