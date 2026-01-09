"use client";

import { ComingSoonPage } from "@/features/shared";
import { Bell } from "lucide-react";

export default function NotificationSettingsPage() {
  return (
    <ComingSoonPage
      title="Notification Settings"
      description="Configure notification preferences and delivery channels."
      phase="Settings"
      icon={Bell}
      features={[
        "Email notification settings",
        "Slack/Teams integration",
        "Notification frequency",
        "Alert thresholds",
        "Quiet hours configuration",
      ]}
    />
  );
}
