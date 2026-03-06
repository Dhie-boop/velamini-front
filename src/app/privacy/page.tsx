'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Moon, Sun, Info, ScanLine, Settings, Cookie, ShieldCheck, Scale, Mail } from 'lucide-react';

const sections = [
  {
    number: '01',
    title: 'Overview',
    Icon: Info,
    content: 'This Privacy Policy explains how Velamini collects, uses, and discloses personal information when you use our Service.',
  },
  {
    number: '02',
    title: 'Information We Collect',
    Icon: ScanLine,
    content: 'We collect information you provide (account details, profile information) and non-personal usage data (analytics, logs). We may also collect data from third-party providers when you sign in with them.',
  },
  {
    number: '03',
    title: 'How We Use Information',
    Icon: Settings,
    content: 'We use information to provide, maintain, and improve the Service; to personalize your experience; and to communicate with you.',
  },
  {
    number: '04',
    title: 'Cookies & Tracking',
    Icon: Cookie,
    content: 'We use cookies and similar technologies for authentication, analytics, and preferences. You can control cookie settings through your browser.',
  },
  {
    number: '05',
    title: 'Data Security',
    Icon: ShieldCheck,
    content: 'We take reasonable measures to protect your information, but no system is completely secure. If you believe your account has been compromised, contact us immediately.',
    isContact: true,
    contactEmail: 'privacy@velamini.example',
  },
  {
    number: '06',
    title: 'Your Rights',
    Icon: Scale,
    content: 'Depending on your jurisdiction, you may have rights to access, correct, or delete your personal information. Contact us to exercise those rights.',
  },
];

export default function PrivacyPage() {
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
          --pp-bg:        #EBF5FF;
          --pp-surface:   #FFFFFF;
          --pp-surface-2: #E2F0FC;
          --pp-border:    #C5DCF2;
          --pp-text:      #0A1C2C;
          --pp-muted:     #6B90AE;
          --pp-accent:    #29A9D4;
          --pp-accent2:   #1D8BB2;
          --pp-soft:      #DDF1FA;
          --pp-shadow:    0 4px 24px rgba(10,40,80,.09);
          --pp-shadow-lg: 0 16px 48px rgba(10,40,80,.12);
        }
        [data-mode="dark"]{
          --pp-bg:        #071320;
          --pp-surface:   #0F1E2D;
          --pp-surface-2: #162435;
          --pp-border:    #1A3045;
          --pp-text:      #C8E8F8;
          --pp-muted:     #3D6580;
          --pp-accent:    #38AECC;
          --pp-accent2:   #2690AB;
          --pp-soft:      #0C2535;
          --pp-shadow:    0 4px 24px rgba(0,0,0,.3);
          --pp-shadow-lg: 0 16px 48px rgba(0,0,0,.4);
        }

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;background:var(--pp-bg);color:var(--pp-text);transition:background .3s,color .3s}

        .pp-page{min-height:100dvh;background:var(--pp-bg);color:var(--pp-text);transition:background .3s,color .3s}

        .pp-page::before{
          content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
          background-image:
            linear-gradient(rgba(41,169,212,.05) 1px,transparent 1px),
            linear-gradient(90deg,rgba(41,169,212,.05) 1px,transparent 1px);
          background-size:48px 48px;
          mask-image:radial-gradient(ellipse 80% 60% at 50% 30%,black 30%,transparent 100%);
        }

        /* ── Navbar ── */
        .pp-nav{
          position:fixed;top:0;left:0;right:0;z-index:50;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 20px;height:56px;
          background:color-mix(in srgb,var(--pp-surface) 85%,transparent);
          border-bottom:1px solid var(--pp-border);
          backdrop-filter:blur(12px);
          transition:background .3s,border-color .3s;
        }
        .pp-nav-brand{display:flex;align-items:center;gap:10px;text-decoration:none}
        .pp-nav-logo{
          width:32px;height:32px;border-radius:8px;overflow:hidden;
          border:1.5px solid var(--pp-border);background:var(--pp-soft);flex-shrink:0;
        }
        .pp-nav-logo img{width:100%;height:100%;object-fit:cover;display:block}
        .pp-nav-name{
          font-family:'DM Serif Display',Georgia,serif;
          font-size:.95rem;color:var(--pp-text);letter-spacing:-.01em;
        }
        .pp-nav-right{display:flex;align-items:center;gap:8px}
        .pp-nav-link{
          font-size:.78rem;font-weight:500;color:var(--pp-muted);
          text-decoration:none;padding:4px 8px;border-radius:6px;
          transition:color .14s;
        }
        .pp-nav-link:hover{color:var(--pp-accent)}
        .pp-theme-btn{
          display:flex;align-items:center;justify-content:center;
          width:32px;height:32px;border-radius:8px;
          border:1px solid var(--pp-border);background:var(--pp-surface-2);
          color:var(--pp-muted);cursor:pointer;
          transition:all .15s;
        }
        .pp-theme-btn:hover{color:var(--pp-accent);border-color:var(--pp-accent)}
        .pp-theme-btn svg{width:14px;height:14px}

        /* ── Main ── */
        .pp-main{
          position:relative;z-index:1;
          max-width:720px;margin:0 auto;
          padding:96px 20px 64px;
        }

        /* ── Header ── */
        .pp-header{text-align:center;margin-bottom:52px}
        .pp-eyebrow{
          display:inline-flex;align-items:center;gap:7px;
          font-size:.67rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
          color:var(--pp-accent);background:var(--pp-soft);
          padding:4px 12px;border-radius:20px;
          border:1px solid color-mix(in srgb,var(--pp-accent) 25%,transparent);
          margin-bottom:16px;
        }
        .pp-eyebrow-dot{
          width:5px;height:5px;border-radius:50%;background:var(--pp-accent);
          animation:ppdot 1.8s ease-in-out infinite;
        }
        @keyframes ppdot{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
        .pp-title{
          font-family:'DM Serif Display',Georgia,serif;
          font-size:clamp(1.9rem,5vw,2.9rem);font-weight:400;
          letter-spacing:-.025em;color:var(--pp-text);line-height:1.15;margin-bottom:10px;
        }
        .pp-title em{font-style:italic;color:var(--pp-accent)}
        .pp-date{
          font-size:.78rem;color:var(--pp-muted);
          display:inline-flex;align-items:center;gap:5px;
        }
        .pp-date-dot{width:3px;height:3px;border-radius:50%;background:var(--pp-muted)}

        /* ── Notice banner ── */
        .pp-notice{
          display:flex;align-items:flex-start;gap:12px;
          margin-bottom:28px;padding:14px 16px;
          background:var(--pp-soft);
          border:1px solid color-mix(in srgb,var(--pp-accent) 25%,transparent);
          border-radius:12px;
          font-size:.8rem;color:var(--pp-muted);line-height:1.6;
          transition:background .3s,border-color .3s;
        }
        .pp-notice-icon{
          flex-shrink:0;width:22px;height:22px;border-radius:50%;
          background:var(--pp-accent);
          display:flex;align-items:center;justify-content:center;margin-top:1px;
        }
        .pp-notice-icon svg{width:11px;height:11px;color:#fff}

        /* ── Card ── */
        .pp-card{
          background:var(--pp-surface);border:1px solid var(--pp-border);
          border-radius:20px;padding:36px 36px 28px;
          box-shadow:var(--pp-shadow-lg);
          position:relative;overflow:hidden;
          transition:background .3s,border-color .3s;
        }
        .pp-card::before{
          content:'';position:absolute;top:0;left:0;right:0;height:3px;
          background:linear-gradient(90deg,var(--pp-accent),#7DD3FC,var(--pp-accent));
          background-size:200% 100%;animation:ppshimmer 4s linear infinite;
        }
        @keyframes ppshimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @media(max-width:480px){.pp-card{padding:22px 16px 20px;border-radius:16px}}

        /* ── Sections ── */
        .pp-sections{display:flex;flex-direction:column;position:relative}
        .pp-sections::before{
          content:'';position:absolute;top:24px;bottom:24px;left:28px;
          width:1.5px;
          background:linear-gradient(to bottom,var(--pp-accent) 0%,var(--pp-border) 40%,var(--pp-border) 60%,transparent 100%);
          border-radius:2px;
        }
        @media(max-width:480px){.pp-sections::before{left:20px}}

        .pp-section{
          display:flex;align-items:flex-start;gap:20px;
          padding:22px 0;border-bottom:1px solid var(--pp-border);
          transition:border-color .3s;
        }
        .pp-section:last-child{border-bottom:none}
        @media(max-width:480px){.pp-section{gap:14px}}

        .pp-num{
          flex-shrink:0;width:36px;height:36px;border-radius:50%;
          background:var(--pp-surface);border:1.5px solid var(--pp-border);
          display:flex;align-items:center;justify-content:center;
          font-size:.63rem;font-weight:700;color:var(--pp-accent);
          letter-spacing:.04em;box-shadow:var(--pp-shadow);
          position:relative;z-index:1;margin-top:2px;
          transition:border-color .2s,background .2s;
        }
        @media(max-width:480px){.pp-num{width:30px;height:30px}}
        .pp-section:hover .pp-num{background:var(--pp-soft);border-color:var(--pp-accent)}

        .pp-section-body{flex:1;min-width:0;padding-top:2px}
        .pp-section-head{display:flex;align-items:center;gap:8px;margin-bottom:7px}
        .pp-section-icon{
          width:28px;height:28px;border-radius:7px;
          background:var(--pp-soft);
          display:flex;align-items:center;justify-content:center;
          color:var(--pp-accent);flex-shrink:0;
          transition:background .2s;
        }
        .pp-section-icon svg{width:13px;height:13px}
        .pp-section:hover .pp-section-icon{background:color-mix(in srgb,var(--pp-accent) 15%,transparent)}
        .pp-section-title{
          font-family:'DM Serif Display',Georgia,serif;
          font-size:1.05rem;font-weight:400;
          color:var(--pp-text);letter-spacing:-.01em;
        }
        .pp-section-text{font-size:.865rem;line-height:1.72;color:var(--pp-muted)}

        .pp-contact-link{
          display:inline-flex;align-items:center;gap:7px;
          margin-top:10px;padding:8px 14px;border-radius:10px;
          background:var(--pp-soft);
          border:1px solid color-mix(in srgb,var(--pp-accent) 30%,transparent);
          color:var(--pp-accent);font-size:.8rem;font-weight:600;
          text-decoration:none;transition:all .16s;
        }
        .pp-contact-link:hover{background:var(--pp-accent);color:#fff;transform:translateY(-1px);box-shadow:0 4px 14px rgba(41,169,212,.25)}
        .pp-contact-link svg{width:13px;height:13px}

        /* ── Footer ── */
        .pp-footer{
          text-align:center;margin-top:52px;padding-top:24px;
          border-top:1px solid var(--pp-border);
          font-size:.72rem;color:var(--pp-muted);
          transition:border-color .3s;
        }
        .pp-footer a{color:var(--pp-muted);text-decoration:none;transition:color .14s}
        .pp-footer a:hover{color:var(--pp-accent)}
      `}</style>

      <div className="pp-page">

        {/* Navbar */}
        <nav className="pp-nav">
          <Link href="/" className="pp-nav-brand">
            <div className="pp-nav-logo">
              <img src="/logo.png" alt="Velamini" />
            </div>
            <span className="pp-nav-name">Velamini</span>
          </Link>
          <div className="pp-nav-right">
            <Link href="/terms" className="pp-nav-link">Terms</Link>
            {mounted && (
              <button className="pp-theme-btn" onClick={toggleTheme} title="Toggle theme">
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            )}
          </div>
        </nav>

        <main className="pp-main">
          {/* Header */}
          <header className="pp-header">
            <div className="pp-eyebrow">
              <span className="pp-eyebrow-dot" />
              Legal
            </div>
            <h1 className="pp-title">Privacy <em>Policy</em></h1>
            <p className="pp-date">
              Last updated <span className="pp-date-dot" /> February 23, 2026
            </p>
          </header>

          {/* Card */}
          <div className="pp-card">

            {/* Notice */}
            <div className="pp-notice">
              <div className="pp-notice-icon">
                <Info size={11} color="#fff" />
              </div>
              <span>
                We respect your privacy. This policy describes what data we collect, why we collect it, and how you can control it.
              </span>
            </div>

            <div className="pp-sections">
              {sections.map((s) => (
                <div className="pp-section" key={s.number}>
                  <div className="pp-num">{s.number}</div>
                  <div className="pp-section-body">
                    <div className="pp-section-head">
                      <div className="pp-section-icon">
                        <s.Icon size={13} />
                      </div>
                      <h2 className="pp-section-title">{s.title}</h2>
                    </div>
                    <p className="pp-section-text">{s.content}</p>
                    {s.isContact && (
                      <a className="pp-contact-link" href={`mailto:${s.contactEmail}`}>
                        <Mail size={13} />
                        {s.contactEmail}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <footer className="pp-footer">
            © {new Date().getFullYear()} Velamini &nbsp;·&nbsp;{' '}
            <Link href="/terms">Terms</Link>&nbsp;·&nbsp;
            <Link href="/privacy">Privacy</Link>
          </footer>
        </main>
      </div>
    </>
  );
}