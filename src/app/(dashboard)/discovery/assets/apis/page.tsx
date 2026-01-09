"use client";

import { ComingSoonPage } from "@/features/shared";
import { Zap } from "lucide-react";

export default function APIsPage() {
  return (
    <ComingSoonPage
      title="APIs"
      description="Discover and catalog API endpoints across your applications and services."
      phase="Discovery"
      icon={Zap}
      features={[
        "API endpoint discovery and cataloging",
        "OpenAPI/Swagger specification import",
        "Authentication method detection",
        "API versioning and deprecation tracking",
        "Sensitive data exposure detection",
      ]}
    />
  );
}
