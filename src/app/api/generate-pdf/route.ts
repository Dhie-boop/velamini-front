import { NextRequest } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: NextRequest) {
  const { html } = await req.json();
  if (!html || typeof html !== "string") {
    return new Response(JSON.stringify({ error: "Missing HTML" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();
    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=resume.pdf",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "PDF generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
