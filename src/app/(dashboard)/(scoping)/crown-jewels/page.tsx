"use client";

import { ComingSoonPage } from "@/features/shared";
import { Crown } from "lucide-react";

export default function CrownJewelsPage() {
  return (
    <ComingSoonPage
      title="Crown Jewels"
      description="Identify and protect your organization's most critical assets that require the highest level of security."
      phase="Scoping"
      icon={Crown}
      features={[
        "Identify mission-critical assets",
        "Define protection requirements",
        "Map data flows and dependencies",
        "Set priority for security controls",
        "Track exposure of critical assets",
      ]}
    />
  );
}
