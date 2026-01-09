"use client";

import { ComingSoonPage } from "@/features/shared";
import { Smartphone } from "lucide-react";

export default function MobileAppsPage() {
  return (
    <ComingSoonPage
      title="Mobile Apps"
      description="Inventory and analyze mobile applications across iOS and Android platforms."
      phase="Discovery"
      icon={Smartphone}
      features={[
        "Mobile app binary analysis",
        "API endpoint extraction",
        "Hardcoded secrets detection",
        "Third-party SDK analysis",
        "App store monitoring",
      ]}
    />
  );
}
