
import React, { useState, useEffect } from "react";

const SettingsPage: React.FC = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [swagName, setSwagName] = useState("");
  const [swagSuccess, setSwagSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [swagList, setSwagList] = useState<{ id: string; content: string }[]>([]);
  const [copiedSwagId, setCopiedSwagId] = useState<string | null>(null);

  const handleCreateSwag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swagName.trim()) return;
    try {
      const res = await fetch("/api/swag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: swagName.trim() }),
      });
      if (res.ok) {
        setSwagSuccess(true);
        setSwagName("");
        await fetchSwagList();
        setTimeout(() => setSwagSuccess(false), 2000);
      }
    } catch {
      // Optionally handle error
    }
  };

  const fetchSwagList = async () => {
    const res = await fetch("/api/swag");
    if (res.ok) {
      const data = await res.json();
      setSwagList(Array.isArray(data.swag) ? data.swag : []);
    }
  };

  useEffect(() => {
    fetchSwagList();
  }, []);

  const getSwagUrl = (content: string) => {
    return `${typeof window !== "undefined" ? window.location.origin : "https://velamini.com"}/swag/${encodeURIComponent(content.replace(/\s+/g, "-").toLowerCase())}`;
  };

  const handleCopySwagUrl = async (swagId: string, content: string) => {
    const swagUrl = getSwagUrl(content);
    try {
      await navigator.clipboard.writeText(swagUrl);
      setCopiedSwagId(swagId);
      setTimeout(() => setCopiedSwagId(null), 1500);
    } catch {
      setCopiedSwagId(null);
    }
  };

  return ( 
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center py-12 px-2">
      <div className="flex flex-col md:flex-row gap-8 items-start justify-center w-full max-w-4xl">
        {/* Share & Swag column */}
        <div className="flex flex-col gap-8 flex-1 min-w-[320px] max-w-md">
          {/* Share Your Virtual Self */}
          <div className="card border border-base-300 bg-base-100 shadow-sm mx-auto w-full">
            <div className="card-body">
              <h2 className="card-title text-xl">Share Your Virtual Self</h2>
              <p className="text-base-content/70">
                Allow others to chat with your AI-powered virtual self
              </p>
              <div className="mt-4 flex items-center gap-4">
                <input
                  type="checkbox"
                  className="toggle toggle-lg"
                  aria-label="Toggle sharing"
                  checked={isSharing}
                  onChange={() => setIsSharing((v) => !v)}
                />
                <span className={`badge ${isSharing ? "badge-success" : "badge-ghost"}`}>{isSharing ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>

          {/* Create Swag */}
          <div className="card border border-base-300 bg-base-100 shadow-sm mx-auto w-full">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <h2 className="card-title text-xl">Create Swag</h2>
                <span className="badge badge-neutral">New</span>
              </div>
              <form className="mt-4 grid gap-4" onSubmit={handleCreateSwag}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Swag Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Velamini T-shirt"
                    className="input input-bordered w-full"
                    value={swagName}
                    onChange={e => setSwagName(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-accent w-full"
                  disabled={!swagName.trim()}
                >
                  Create Swag
                </button>
                {swagSuccess && (
                  <div className="alert alert-success shadow-sm">Swag created successfully!</div>
                )}
              </form>
              {/* Swag List */}
              {swagList.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Your Swag</h3>
                  <ul className="space-y-2">
                    {swagList.map(swag => (
                      <li key={swag.id} className="flex items-center gap-2">
                        <span className="truncate max-w-xs">{swag.content}</span>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleCopySwagUrl(swag.id, swag.content)}
                          type="button"
                        >
                          {copiedSwagId === swag.id ? "Copied!" : "Copy URL"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Copy Swag URL column removed: now handled per swag item */}
      </div>
    </div>
	);
};

export default SettingsPage;

