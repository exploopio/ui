"use client";

import { ComingSoonPage } from "@/features/shared";
import { Layers } from "lucide-react";

export default function BusinessUnitsPage() {
  return (
    <ComingSoonPage
      title="Business Units"
      description="Define and manage your organization's business units to align security priorities with business objectives."
      phase="Scoping"
      icon={Layers}
      features={[
        "Create and organize business units hierarchy",
        "Assign assets and systems to business units",
        "Define criticality levels per business unit",
        "Map business processes to technical assets",
        "Set risk tolerance thresholds",
      ]}
    />
  );
}
