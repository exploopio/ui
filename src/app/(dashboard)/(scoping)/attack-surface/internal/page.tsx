"use client";

import { ComingSoonPage } from "@/features/shared";
import { Network } from "lucide-react";

export default function InternalSurfacePage() {
  return (
    <ComingSoonPage
      title="Internal Attack Surface"
      description="Map and monitor your internal network assets and their security posture."
      phase="Scoping"
      icon={Network}
      features={[
        "Internal network asset discovery",
        "Segment and zone mapping",
        "Internal service exposure analysis",
        "Lateral movement path identification",
        "Network segmentation validation",
      ]}
    />
  );
}
