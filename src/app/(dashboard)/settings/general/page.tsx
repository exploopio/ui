"use client";

import { ComingSoonPage } from "@/features/shared";
import { Settings } from "lucide-react";

export default function GeneralSettingsPage() {
  return (
    <ComingSoonPage
      title="General Settings"
      description="Configure general platform settings and preferences."
      phase="Settings"
      icon={Settings}
      features={[
        "Platform preferences",
        "Date and time settings",
        "Language preferences",
        "Default configurations",
        "Data retention policies",
      ]}
    />
  );
}
