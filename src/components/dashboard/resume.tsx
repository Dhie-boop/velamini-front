
"use client";

import React, { useState, useRef } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";

// Add TypeScript declaration for window.html2pdf
declare global {
  interface Window {
    html2pdf: any;
  }
}


const TEMPLATE = {
  id: "modern-yellow",
  name: "Modern Yellow",
  image: "/image.png",
  description: "A modern, clean template with a yellow header.",
};

export default function Resume() {
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resumeContent, setResumeContent] = useState<React.ReactNode | null>(null);
  const [resumeHtml, setResumeHtml] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  // Always use the default template
  const userPayload = { userId: session?.user?.id, template: TEMPLATE.id };

  const handleGenerateResume = async () => {
    setLoading(true);
    setShowPreview(true);
    setResumeContent(null);
    setError(null);
    try {
      const res = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPayload),
      });
      if (!res.ok) throw new Error("Failed to generate resume");
      const data = await res.json();
      let html = data.resumeHtml;
      // Remove markdown code block if present
      if (typeof html === "string" && html.trim().startsWith("```")) {
        html = html.replace(/^```[a-zA-Z]*\n?|```$/g, "").trim();
      }
      setResumeHtml(html || "");
      setResumeContent(
        <div className="relative w-full max-w-2xl mx-auto">
          {/* Resume HTML rendered directly */}
          {html ? (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <pre className="whitespace-pre-wrap text-base-content/80">{data.resumeText || "No resume generated."}</pre>
          )}
        </div>
      );
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-base-200">
      {/* Single column layout */}
      <div className="w-full max-w-xl flex flex-col items-center gap-8">
        <h2 className="text-2xl font-bold mb-2 text-primary">Resume Builder</h2>
        <button className="btn btn-primary mb-4 w-full" onClick={handleGenerateResume} disabled={loading}>
          {loading ? <span className="loading loading-spinner text-success mr-2"></span> : null}
          Create Resume
        </button>
        <ul>
          <li>Use clear, concise language.</li>
          <li>Customize your summary for your goals.</li>
          <li>Proofread for grammar and clarity.</li>
        </ul>
      </div>
      {/* Professional Preview Modal */}
      {showPreview && (
        <>
          <Script
            src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
            strategy="afterInteractive"
          />
          <div className="fixed inset-0 z-50 flex flex-col bg-black bg-opacity-40">
            <div className="relative flex flex-col h-full w-full items-center justify-center bg-white rounded-none shadow-lg border border-base-300 p-0">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                onClick={() => { setShowPreview(false); setLoading(false); setError(null); }}
                aria-label="Close preview"
                style={{zIndex: 10}}
              >
                ✕
              </button>
              {loading ? (
                <span className="loading loading-spinner text-success"></span>
              ) : resumeContent ? (
                <>
                  {/* Full-page resume preview */}
                  <div className="w-full h-full overflow-auto p-8" style={{ background: '#fff' }}>
                    <div dangerouslySetInnerHTML={{ __html: resumeHtml }} />
                  </div>
                  <div className="w-full flex justify-center p-6 bg-white border-t border-base-300">
                    <button
                      className="btn btn-success"
                      disabled={downloading}
                      onClick={() => {
                        if (!window.html2pdf || !resumeHtml) return;
                        setDownloading(true);
                        // Create a small, off-screen div for PDF generation
                        const tempDiv = document.createElement('div');
                        tempDiv.style.position = 'fixed';
                        tempDiv.style.left = '-9999px';
                        tempDiv.style.top = '0';
                        tempDiv.style.width = '1px';
                        tempDiv.style.height = '1px';
                        tempDiv.innerHTML = resumeHtml;
                        document.body.appendChild(tempDiv);
                        window.html2pdf()
                          .from(tempDiv)
                          .set({
                            margin: 0.5,
                            filename: "resume.pdf",
                            html2canvas: { scale: 2 },
                            jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
                          })
                          .save();
                        // Remove the div immediately to avoid UI blocking
                        setTimeout(() => {
                          document.body.removeChild(tempDiv);
                          setDownloading(false);
                        }, 1000);
                      }}
                    >
                      {downloading ? 'Downloading...' : 'Download PDF'}
                    </button>
                  </div>
                </>
              ) : (
                <span className="text-base-content/60">No resume generated yet.</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
