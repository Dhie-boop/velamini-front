
"use client";

import React, { useState, useRef } from "react";
import { useSession } from "next-auth/react";



const TEMPLATE = {
  id: "modern-yellow",
  name: "Modern Yellow",
  image: "http://localhost:3000/logo.png",
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
                      onClick={async () => {
                        if (!resumeHtml) return;
                        setDownloading(true);
                        try {
                          const response = await fetch("/api/generate-pdf", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ html: resumeHtml }),
                          });
                          if (!response.ok) throw new Error("PDF generation failed");
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "resume.pdf";
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          window.URL.revokeObjectURL(url);
                        } catch (err) {
                          setError("PDF download failed");
                        } finally {
                          setDownloading(false);
                        }
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
