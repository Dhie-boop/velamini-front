"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle, Loader2, Mail, RefreshCw, ShieldCheck } from "lucide-react";

type PageState = "sending" | "waiting" | "verifying" | "success" | "error";

function sanitizeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/Dashboard";
  return raw;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const nextPath = useMemo(() => sanitizeNext(searchParams.get("next")), [searchParams]);

  const [pageState, setPageState] = useState<PageState>("sending");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendOtp = useCallback(async () => {
    setPageState("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/send-otp", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        if (typeof data.cooldown === "number") setCooldown(data.cooldown);
        setErrorMsg(data.error || "Failed to send code.");
        setPageState("error");
        return;
      }

      setPageState("waiting");
      setCooldown(typeof data.cooldown === "number" ? data.cooldown : 60);
      setAttemptsLeft(5);
      setOtp(["", "", "", "", "", ""]);
      window.setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } catch {
      setErrorMsg("Network error. Please try again.");
      setPageState("error");
    }
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    setPageState("verifying");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (typeof data.attemptsLeft === "number") setAttemptsLeft(data.attemptsLeft);
        setErrorMsg(data.error || "Incorrect code.");
        setOtp(["", "", "", "", "", ""]);
        setPageState("waiting");
        window.setTimeout(() => inputsRef.current[0]?.focus(), 50);
        return;
      }

      setPageState("success");
      await update();
      window.setTimeout(() => router.replace(nextPath), 1500);
    } catch {
      setErrorMsg("Network error. Please try again.");
      setPageState("waiting");
    }
  }, [nextPath, router, update]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(`/verify-email?next=${encodeURIComponent(nextPath)}`)}`);
    }
  }, [nextPath, router, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (session?.user?.emailVerified) {
      router.replace(nextPath);
    }
  }, [nextPath, router, session?.user?.emailVerified, status]);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.emailVerified) return;
    const timer = window.setTimeout(() => {
      void sendOtp();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [sendOtp, session?.user?.emailVerified, status]);

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((value) => {
        if (value <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  useEffect(() => {
    if (pageState === "waiting" && otp.every((digit) => digit !== "")) {
      const timer = window.setTimeout(() => {
        void verifyOtp(otp.join(""));
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [otp, pageState, verifyOtp]);

  function handleOtpInput(index: number, value: string) {
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      setOtp(value.split(""));
      inputsRef.current[5]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputsRef.current[index + 1]?.focus();
  }

  const maskedEmail = session?.user?.email
    ? session.user.email.replace(/(.{2}).*(@.*)/, "$1****$2")
    : "your email";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        :root,[data-mode="light"]{
          --ve-bg:#EBF5FF;--ve-surface:#FFFFFF;--ve-border:#C5DCF2;--ve-text:#0A1C2C;--ve-muted:#6B90AE;--ve-accent:#29A9D4;--ve-soft:#DDF1FA;--ve-danger:#EF4444;
        }
        [data-mode="dark"]{
          --ve-bg:#071320;--ve-surface:#0F1E2D;--ve-border:#1A3045;--ve-text:#C8E8F8;--ve-muted:#5B8FA8;--ve-accent:#38AECC;--ve-soft:#0C2535;--ve-danger:#F87171;
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{min-height:100%}
        body{font-family:'DM Sans',system-ui,sans-serif;background:var(--ve-bg);color:var(--ve-text)}
        .ve-page{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;background:
          radial-gradient(circle at 15% 15%, color-mix(in srgb,var(--ve-accent) 16%, transparent), transparent 28%),
          radial-gradient(circle at 85% 10%, color-mix(in srgb,#7DD3FC 16%, transparent), transparent 24%),
          var(--ve-bg);}
        .ve-card{width:100%;max-width:460px;background:color-mix(in srgb,var(--ve-surface) 92%, transparent);border:1px solid var(--ve-border);border-radius:24px;padding:34px 28px;box-shadow:0 24px 70px rgba(0,0,0,.16)}
        .ve-icon{width:58px;height:58px;border-radius:16px;background:color-mix(in srgb,var(--ve-accent) 14%, transparent);border:1px solid color-mix(in srgb,var(--ve-accent) 28%, transparent);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:var(--ve-accent)}
        .ve-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;border:1px solid color-mix(in srgb,var(--ve-accent) 28%, transparent);background:color-mix(in srgb,var(--ve-accent) 10%, transparent);color:var(--ve-accent);font-size:.67rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
        .ve-head{text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px;margin-bottom:24px}
        .ve-title{font-family:'DM Serif Display',serif;font-size:1.9rem;line-height:1.1}
        .ve-sub{font-size:.88rem;line-height:1.7;color:var(--ve-muted)}
        .ve-email{display:block;margin-top:4px;color:var(--ve-accent);font-weight:700}
        .ve-otp{display:flex;gap:10px;justify-content:center;margin-bottom:16px}
        .ve-input{width:50px;height:58px;border-radius:14px;border:2px solid var(--ve-border);background:var(--ve-surface);color:var(--ve-text);text-align:center;font-size:1.45rem;font-weight:800;outline:none}
        .ve-input:focus{border-color:var(--ve-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--ve-accent) 18%, transparent)}
        .ve-input--filled{border-color:color-mix(in srgb,var(--ve-accent) 52%, transparent)}
        .ve-input--error{border-color:var(--ve-danger)!important}
        .ve-error{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--ve-danger) 10%, transparent);border:1px solid color-mix(in srgb,var(--ve-danger) 22%, transparent);color:var(--ve-danger);font-size:.8rem;line-height:1.5;margin-bottom:12px}
        .ve-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0}
        .ve-attempts{text-align:center;font-size:.74rem;color:var(--ve-danger);margin-bottom:12px}
        .ve-btn{width:100%;min-height:48px;border:none;border-radius:14px;background:var(--ve-accent);color:#fff;font-size:.92rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:transform .15s,opacity .15s}
        .ve-btn:hover:not(:disabled){transform:translateY(-1px)}
        .ve-btn:disabled{opacity:.6;cursor:not-allowed}
        .ve-resend{margin-top:14px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:.8rem;color:var(--ve-muted)}
        .ve-link{background:none;border:none;padding:0;color:var(--ve-accent);font:inherit;font-weight:700;cursor:pointer}
        .ve-link:disabled{color:var(--ve-muted);cursor:not-allowed}
        .ve-success{text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px}
        .ve-spin{animation:ve-spin 1s linear infinite}
        @keyframes ve-spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="ve-page">
        <AnimatePresence mode="wait">
          {pageState === "success" ? (
            <motion.div
              key="success"
              className="ve-card"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
            >
              <div className="ve-success">
                <div className="ve-icon"><CheckCircle size={26} /></div>
                <h1 className="ve-title">Email verified</h1>
                <p className="ve-sub">Your account is active now. Redirecting you to continue.</p>
                <div className="ve-resend"><Loader2 size={14} className="ve-spin" /> Redirecting…</div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="main"
              className="ve-card"
              initial={{ opacity: 0, scale: 0.98, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
            >
              <div className="ve-head">
                <div className="ve-icon">
                  {pageState === "sending" || pageState === "verifying" ? (
                    <Loader2 size={24} className="ve-spin" />
                  ) : (
                    <Mail size={24} />
                  )}
                </div>
                <div className="ve-pill"><ShieldCheck size={11} /> Verify Email</div>
                <h1 className="ve-title">Check your inbox</h1>
                <p className="ve-sub">
                  We sent a 6-digit code to
                  <span className="ve-email">{maskedEmail}</span>
                </p>
              </div>

              <div className="ve-otp">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputsRef.current[index] = element;
                    }}
                    className={`ve-input ${digit ? "ve-input--filled" : ""} ${errorMsg ? "ve-input--error" : ""}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpInput(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onFocus={(e) => e.target.select()}
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    disabled={pageState === "sending" || pageState === "verifying" || status !== "authenticated"}
                  />
                ))}
              </div>

              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    className="ve-error"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="ve-dot" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {attemptsLeft < 3 && attemptsLeft > 0 && pageState === "waiting" && (
                <p className="ve-attempts">{attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} remaining</p>
              )}

              <button
                className="ve-btn"
                onClick={() => void verifyOtp(otp.join(""))}
                disabled={otp.some((digit) => !digit) || pageState === "sending" || pageState === "verifying"}
              >
                {pageState === "verifying" ? (
                  <>
                    <Loader2 size={14} className="ve-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    Verify email
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="ve-resend">
                <span>Didn&apos;t get the code?</span>
                <button
                  className="ve-link"
                  onClick={() => void sendOtp()}
                  disabled={cooldown > 0 || pageState === "sending" || pageState === "verifying"}
                >
                  {pageState === "sending" ? (
                    <>
                      <RefreshCw size={12} className="ve-spin" /> Sending…
                    </>
                  ) : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
