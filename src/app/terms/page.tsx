'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Moon, Sun, FileText, CheckCircle, UserCheck, Database, XCircle, RefreshCw, Mail } from 'lucide-react';

const sections = [
  {
    number: '01',
    title: 'Acceptance',
    Icon: CheckCircle,
    content: 'By using Velamini (the "Service") you agree to these Terms of Service. Please read them carefully. If you do not agree, do not use the Service.',
  },
  {
    number: '02',
    title: 'Use of Service',
    Icon: FileText,
    content: 'You may use the Service only in compliance with these terms and applicable laws. You are responsible for your account and any activity that occurs under your account.',
  },
  {
    number: '03',
    title: 'Accounts & Security',
    Icon: UserCheck,
    content: 'You must provide accurate account information and keep your credentials secure. You are responsible for all activity under your account.',
  },
  {
    number: '04',
    title: 'Content',
    Icon: Database,
    content: 'You retain ownership of the content you submit. By submitting content you grant Velamini a license to use it as needed to provide the Service.',
  },
  {
    number: '05',
    title: 'Termination',
    Icon: XCircle,
    content: 'We may suspend or terminate accounts for violations of these Terms or for other reasons permitted by law.',
  },
  {
    number: '06',
    title: 'Changes',
    Icon: RefreshCw,
    content: 'We may update these Terms from time to time. Changes will be posted on this page with an updated effective date.',
  },
  {
    number: '07',
    title: 'Contact',
    Icon: Mail,
    content: 'Have questions about these Terms? We\'re happy to help.',
    isContact: true,
    contactEmail: 'support@velamini.com',
  },
];

export default function TermsPage() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
      const dark = stored === 'dark' || (!stored && prefersDark);
      setIsDark(dark);
      document.documentElement.setAttribute('data-mode', dark ? 'dark' : 'light');
    } catch {}
  }, []);

  const toggleTheme = () => {
    try {
      const next = !isDark;
      setIsDark(next);
      document.documentElement.setAttribute('data-mode', next ? 'dark' : 'light');
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {}
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root,[data-mode="light"]{
          --tp-bg:        #EBF5FF;
          --tp-surface:   #FFFFFF;
          --tp-surface-2: #E2F0FC;
          --tp-border:    #C5DCF2;
          --tp-text:      #0A1C2C;
          --tp-muted:     #6B90AE;
          --tp-accent:    #29A9D4;
          --tp-accent2:   #1D8BB2;
          --tp-soft:      #DDF1FA;
          --tp-shadow:    0 4px 24px rgba(10,40,80,.09);
          --tp-shadow-lg: 0 16px 48px rgba(10,40,80,.12);
        }
        [data-mode="dark"]{
          --tp-bg:        #071320;
          --tp-surface:   #0F1E2D;
          --tp-surface-2: #162435;
          --tp-border:    #1A3045;
          --tp-text:      #C8E8F8;
          --tp-muted:     #3D6580;
          --tp-accent:    #38AECC;
          --tp-accent2:   #2690AB;
          --tp-soft:      #0C2535;
          --tp-shadow:    0 4px 24px rgba(0,0,0,.3);
          --tp-shadow-lg: 0 16px 48px rgba(0,0,0,.4);
        }

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;background:var(--tp-bg);color:var(--tp-text);transition:background .3s,color .3s}

        .tp-page{min-height:100dvh;background:var(--tp-bg);color:var(--tp-text);transition:background .3s,color .3s}

        .tp-page::before{
          content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
          background-image:
            linear-gradient(rgba(41,169,212,.05) 1px,transparent 1px),
            linear-gradient(90deg,rgba(41,169,212,.05) 1px,transparent 1px);
          background-size:48px 48px;
          mask-image:radial-gradient(ellipse 80% 60% at 50% 30%,black 30%,transparent 100%);
        }

        /* ── Navbar ── */
        .tp-nav{
          position:fixed;top:0;left:0;right:0;z-index:50;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 20px;height:56px;
          background:color-mix(in srgb,var(--tp-surface) 85%,transparent);
          border-bottom:1px solid var(--tp-border);
          backdrop-filter:blur(12px);
          transition:background .3s,border-color .3s;
        }
        .tp-nav-brand{display:flex;align-items:center;gap:10px;text-decoration:none}
        .tp-nav-logo{
          width:32px;height:32px;border-radius:8px;overflow:hidden;
          border:1.5px solid var(--tp-border);background:var(--tp-soft);flex-shrink:0;
        }
        .tp-nav-logo img{width:100%;height:100%;object-fit:cover;display:block}
        .tp-nav-name{
          font-family:'DM Serif Display',Georgia,serif;
          font-size:.95rem;color:var(--tp-text);letter-spacing:-.01em;
        }
        .tp-nav-right{display:flex;align-items:center;gap:8px}
        .tp-nav-link{
          font-size:.78rem;font-weight:500;color:var(--tp-muted);
          text-decoration:none;padding:4px 8px;border-radius:6px;
          transition:color .14s;
        }
        .tp-nav-link:hover{color:var(--tp-accent)}
        .tp-theme-btn{
          display:flex;align-items:center;justify-content:center;
          width:32px;height:32px;border-radius:8px;
          border:1px solid var(--tp-border);background:var(--tp-surface-2);
          color:var(--tp-muted);cursor:pointer;
          transition:all .15s;
        }
        .tp-theme-btn:hover{color:var(--tp-accent);border-color:var(--tp-accent)}
        .tp-theme-btn svg{width:14px;height:14px}

        /* ── Main ── */
        .tp-main{
          position:relative;z-index:1;
          max-width:720px;margin:0 auto;
          padding:96px 20px 64px;
        }

        /* ── Header ── */
        .tp-header{text-align:center;margin-bottom:52px}
        .tp-eyebrow{
          display:inline-flex;align-items:center;gap:7px;
          font-size:.67rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
          color:var(--tp-accent);background:var(--tp-soft);
          padding:4px 12px;border-radius:20px;
          border:1px solid color-mix(in srgb,var(--tp-accent) 25%,transparent);
          margin-bottom:16px;
        }
        .tp-eyebrow-dot{
          width:5px;height:5px;border-radius:50%;background:var(--tp-accent);
          animation:tpdot 1.8s ease-in-out infinite;
        }
        @keyframes tpdot{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
        .tp-title{
          font-family:'DM Serif Display',Georgia,serif;
          font-size:clamp(1.9rem,5vw,2.9rem);font-weight:400;
          letter-spacing:-.025em;color:var(--tp-text);line-height:1.15;margin-bottom:10px;
        }
        .tp-title em{font-style:italic;color:var(--tp-accent)}
        .tp-date{
          font-size:.78rem;color:var(--tp-muted);
          display:inline-flex;align-items:center;gap:5px;
        }
        .tp-date-dot{width:3px;height:3px;border-radius:50%;background:var(--tp-muted)}

        /* ── Card ── */
        .tp-card{
          background:var(--tp-surface);border:1px solid var(--tp-border);
          border-radius:20px;padding:36px 36px 28px;
          box-shadow:var(--tp-shadow-lg);
          position:relative;overflow:hidden;
          transition:background .3s,border-color .3s;
        }
        .tp-card::before{
          content:'';position:absolute;top:0;left:0;right:0;height:3px;
          background:linear-gradient(90deg,var(--tp-accent),#7DD3FC,var(--tp-accent));
          background-size:200% 100%;animation:tpshimmer 4s linear infinite;
        }
        @keyframes tpshimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @media(max-width:480px){.tp-card{padding:22px 16px 20px;border-radius:16px}}

        /* ── Sections ── */
        .tp-sections{display:flex;flex-direction:column;position:relative}
        .tp-sections::before{
          content:'';position:absolute;top:24px;bottom:24px;left:28px;
          width:1.5px;
          background:linear-gradient(to bottom,var(--tp-accent) 0%,var(--tp-border) 40%,var(--tp-border) 60%,transparent 100%);
          border-radius:2px;
        }
        @media(max-width:480px){.tp-sections::before{left:20px}}

        .tp-section{
          display:flex;align-items:flex-start;gap:20px;
          padding:22px 0;border-bottom:1px solid var(--tp-border);
          transition:border-color .3s;
        }
        .tp-section:last-child{border-bottom:none}
        @media(max-width:480px){.tp-section{gap:14px}}

        .tp-num{
          flex-shrink:0;width:36px;height:36px;border-radius:50%;
          background:var(--tp-surface);border:1.5px solid var(--tp-border);
          display:flex;align-items:center;justify-content:center;
          font-size:.63rem;font-weight:700;color:var(--tp-accent);
          letter-spacing:.04em;box-shadow:var(--tp-shadow);
          position:relative;z-index:1;margin-top:2px;
          transition:border-color .2s,background .2s;
        }
        @media(max-width:480px){.tp-num{width:30px;height:30px}}
        .tp-section:hover .tp-num{background:var(--tp-soft);border-color:var(--tp-accent)}

        .tp-section-body{flex:1;min-width:0;padding-top:2px}
        .tp-section-head{display:flex;align-items:center;gap:8px;margin-bottom:7px}
        .tp-section-icon{
          width:28px;height:28px;border-radius:7px;
          background:var(--tp-soft);
          display:flex;align-items:center;justify-content:center;
          color:var(--tp-accent);flex-shrink:0;
          transition:background .2s;
        }
        .tp-section-icon svg{width:13px;height:13px}
        .tp-section:hover .tp-section-icon{background:color-mix(in srgb,var(--tp-accent) 15%,transparent)}
        .tp-section-title{
          font-family:'DM Serif Display',Georgia,serif;
          font-size:1.05rem;font-weight:400;
          color:var(--tp-text);letter-spacing:-.01em;
        }
        .tp-section-text{font-size:.865rem;line-height:1.72;color:var(--tp-muted)}

        .tp-contact-link{
          display:inline-flex;align-items:center;gap:7px;
          margin-top:10px;padding:8px 14px;border-radius:10px;
          background:var(--tp-soft);
          border:1px solid color-mix(in srgb,var(--tp-accent) 30%,transparent);
          color:var(--tp-accent);font-size:.8rem;font-weight:600;
          text-decoration:none;transition:all .16s;
        }
        .tp-contact-link:hover{background:var(--tp-accent);color:#fff;transform:translateY(-1px);box-shadow:0 4px 14px rgba(41,169,212,.25)}
        .tp-contact-link svg{width:13px;height:13px}

        /* ── Footer ── */
        .tp-footer{
          text-align:center;margin-top:52px;padding-top:24px;
          border-top:1px solid var(--tp-border);
          font-size:.72rem;color:var(--tp-muted);
          transition:border-color .3s;
        }
        .tp-footer a{color:var(--tp-muted);text-decoration:none;transition:color .14s}
        .tp-footer a:hover{color:var(--tp-accent)}
      `}</style>

      <div className="tp-page">

        {/* Navbar */}
        <nav className="tp-nav">
          <Link href="/" className="tp-nav-brand">
            <div className="tp-nav-logo">
              <img src="/logo.png" alt="Velamini" />
            </div>
            <span className="tp-nav-name">Velamini</span>
          </Link>
          <div className="tp-nav-right">
            <Link href="/privacy" className="tp-nav-link">Privacy</Link>
            {mounted && (
              <button className="tp-theme-btn" onClick={toggleTheme} title="Toggle theme">
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            )}
          </div>
        </nav>

        <main className="tp-main">
          {/* Header */}
          <header className="tp-header">
            <div className="tp-eyebrow">
              <span className="tp-eyebrow-dot" />
              Legal
            </div>
            <h1 className="tp-title">Terms of <em>Service</em></h1>
            <p className="tp-date">
              Last updated <span className="tp-date-dot" /> February 23, 2026
            </p>
          </header>

          {/* Card */}
          <div className="tp-card">
            <div className="tp-sections">
              {sections.map((s) => (
                <div className="tp-section" key={s.number}>
                  <div className="tp-num">{s.number}</div>
                  <div className="tp-section-body">
                    <div className="tp-section-head">
                      <div className="tp-section-icon">
                        <s.Icon size={13} />
                      </div>
                      <h2 className="tp-section-title">{s.title}</h2>
                    </div>
                    <p className="tp-section-text">{s.content}</p>
                    {s.isContact && (
                      <a className="tp-contact-link" href={`mailto:${s.contactEmail}`}>
                        <Mail size={13} />
                        {s.contactEmail}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <footer className="tp-footer">
            © {new Date().getFullYear()} Velamini &nbsp;·&nbsp;{' '}
            <Link href="/terms">Terms</Link>&nbsp;·&nbsp;
            <Link href="/privacy">Privacy</Link>
          </footer>
        </main>
      </div>
    </>
  );
}
