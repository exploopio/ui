"use client";

import { ComingSoonPage } from "@/features/shared";
import { ClipboardCheck } from "lucide-react";

export default function CompliancePage() {
  return (
    <ComingSoonPage
      title="Compliance Requirements"
      description="Manage compliance frameworks and regulatory requirements applicable to your organization."
      phase="Scoping"
      icon={ClipboardCheck}
      features={[
        "Map compliance frameworks (PCI-DSS, SOC2, ISO 27001, GDPR)",
        "Define control requirements per framework",
        "Track compliance status across assets",
        "Generate compliance gap analysis",
        "Automated evidence collection",
      ]}
    />
  );
}
