"use client";

import { ComingSoonPage } from "@/features/shared";
import { Server } from "lucide-react";

export default function HostsPage() {
  return (
    <ComingSoonPage
      title="Hosts"
      description="Discover and manage servers, workstations, and network devices across your infrastructure."
      phase="Discovery"
      icon={Server}
      features={[
        "Automatic host discovery via network scanning",
        "OS fingerprinting and version detection",
        "Open port and service enumeration",
        "Host vulnerability correlation",
        "Asset lifecycle tracking",
      ]}
    />
  );
}
