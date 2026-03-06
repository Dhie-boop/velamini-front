import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

// Read logo once and cache as base64 data URL so Puppeteer can render it
// without needing a live HTTP server (relative paths don't resolve in setContent).
function getLogoDataUrl(): string {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const data = fs.readFileSync(logoPath);
    return `data:image/png;base64,${data.toString("base64")}`;
  } catch {
    return ""; // watermark optional — don't crash if missing
  }
}

const LOGO_DATA_URL = getLogoDataUrl();

/** Fetch a remote URL and return a base64 data: URI, or null on failure. */
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Find every <img src="https://..."> in the html, fetch each URL once,
 * and inline them as base64 data URIs so Puppeteer never needs the network.
 */
async function inlineExternalImages(html: string): Promise<string> {
  const httpSrcRe = /src=["'](https?:\/\/[^"']+)["']/g;
  const urls = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = httpSrcRe.exec(html)) !== null) urls.add(m[1]);

  await Promise.all(
    [...urls].map(async (url) => {
      const dataUrl = await toDataUrl(url);
      if (dataUrl) {
        // replace all occurrences (single and double-quoted)
        html = html
          .replaceAll(`src="${url}"`, `src="${dataUrl}"`)
          .replaceAll(`src='${url}'`, `src='${dataUrl}'`);
      }
    })
  );
  return html;
}

export async function POST(req: NextRequest) {
  let { html } = await req.json();
  if (!html || typeof html !== "string") {
    return new Response(JSON.stringify({ error: "Missing HTML" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Replace any /logo.png references with the inlined base64 so Puppeteer
  // can render the watermark without a running HTTP server.
  if (LOGO_DATA_URL) {
    html = html.replace(/src=['"]\/logo\.png['"]/g, `src="${LOGO_DATA_URL}"`);
  }

  // Fetch all external https:// images and inline as base64 so they appear in the PDF.
  html = await inlineExternalImages(html);

  let browser;
  try {
    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--font-render-hinting=none",
      ],
      headless: true,
    });
    const page = await browser.newPage();
    // All content is inline (CSS + base64 images) — no external requests needed.
    // domcontentloaded is instant vs networkidle0 which waits 30s.
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    // Give the renderer a moment to finish layout before capturing PDF.
    await new Promise((r) => setTimeout(r, 500));
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "15mm", bottom: "15mm", left: "14mm", right: "14mm" },
    });
    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=resume.pdf",
      },
    });
  } catch (err) {
    console.error("[generate-pdf]", err);
    return new Response(JSON.stringify({ error: "PDF generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
