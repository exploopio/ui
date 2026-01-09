"use client";

import { ComingSoonPage } from "@/features/shared";
import { Users } from "lucide-react";

export default function TeamsPage() {
  return (
    <ComingSoonPage
      title="Teams"
      description="Create and manage teams for organizing users and assigning responsibilities."
      phase="Settings"
      icon={Users}
      features={[
        "Team creation and management",
        "Member assignment",
        "Team permissions",
        "Asset ownership mapping",
        "Cross-team collaboration",
      ]}
    />
  );
}
