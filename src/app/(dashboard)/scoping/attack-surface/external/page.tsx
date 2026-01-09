"use client";

import { ComingSoonPage } from "@/features/shared";
import { Globe } from "lucide-react";

export default function ExternalSurfacePage() {
  return (
    <ComingSoonPage
      title="External Attack Surface"
      description="Monitor and manage your internet-facing assets and their exposure to external threats."
      phase="Scoping"
      icon={Globe}
      features={[
        "Discover internet-facing assets automatically",
        "Monitor DNS records and subdomains",
        "Track exposed services and ports",
        "Identify shadow IT and rogue assets",
        "Certificate and SSL/TLS monitoring",
      ]}
    />
  );
}
