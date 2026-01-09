"use client";

import { ComingSoonPage } from "@/features/shared";
import { Cloud } from "lucide-react";

export default function CloudSurfacePage() {
  return (
    <ComingSoonPage
      title="Cloud Attack Surface"
      description="Discover and monitor cloud resources across AWS, Azure, GCP, and other cloud providers."
      phase="Scoping"
      icon={Cloud}
      features={[
        "Multi-cloud asset discovery",
        "Cloud service enumeration",
        "Public exposure detection",
        "IAM and permission analysis",
        "Cloud configuration baseline",
      ]}
    />
  );
}
