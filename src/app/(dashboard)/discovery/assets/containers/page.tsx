"use client";

import { ComingSoonPage } from "@/features/shared";
import { Boxes } from "lucide-react";

export default function ContainersPage() {
  return (
    <ComingSoonPage
      title="Containers"
      description="Inventory Docker containers, Kubernetes pods, and container images across your environment."
      phase="Discovery"
      icon={Boxes}
      features={[
        "Container image vulnerability scanning",
        "Kubernetes cluster discovery",
        "Container runtime security analysis",
        "Image registry integration",
        "Container configuration compliance",
      ]}
    />
  );
}
