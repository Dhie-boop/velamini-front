/**
 * Client-side logger — sends errors to /api/log so they appear in Vercel logs.
 * Safe to call anywhere in client components (fire-and-forget, never throws).
 */
function send(level: "INFO" | "WARN" | "ERROR", route: string, msg: string, data?: unknown) {
  try {
    const ua = navigator.userAgent;
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, route, msg, data: { ...(data as object), ua } }),
    }).catch(() => {});
  } catch {}
}

export const clientLog = {
  info:  (route: string, msg: string, data?: unknown) => send("INFO",  route, msg, data),
  warn:  (route: string, msg: string, data?: unknown) => send("WARN",  route, msg, data),
  error: (route: string, msg: string, data?: unknown) => send("ERROR", route, msg, data),
};
