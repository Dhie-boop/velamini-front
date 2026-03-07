"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrganizationIndexPage() {
  const router = useRouter();
  const [noOrg, setNoOrg] = useState(false);

  useEffect(() => {
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.organizations?.length > 0) {
          router.replace(`/Dashboard/organizations/${d.organizations[0].id}`);
        } else {
          setNoOrg(true);
        }
      })
      .catch(() => setNoOrg(true));
  }, [router]);

  if (noOrg) return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column", gap: 20,
      background: "#081420", fontFamily: "DM Sans,system-ui,sans-serif",
    }}>
      <div style={{ fontSize: "1.5rem", fontFamily: "DM Serif Display,serif", color: "#C8E8F8" }}>
        No organisation found
      </div>
      <p style={{ color: "#3D6580", fontSize: ".86rem", maxWidth: 340, textAlign: "center", lineHeight: 1.6 }}>
        Your account doesn&apos;t have an organisation yet. Create one to get started.
      </p>
      <button
        onClick={() => router.push("/onboarding?create=org")}
        style={{
          padding: "11px 28px", borderRadius: 12, background: "#29A9D4",
          color: "#fff", border: "none", fontSize: ".88rem", fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>
        Create Organisation
      </button>
    </div>
  );

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#081420",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: "3px solid #1A3045", borderTopColor: "#29A9D4",
        animation: "spin .8s linear infinite",
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}