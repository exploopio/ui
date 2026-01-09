"use client";

import { ComingSoonPage } from "@/features/shared";
import { Database } from "lucide-react";

export default function DatabasesPage() {
  return (
    <ComingSoonPage
      title="Databases"
      description="Discover and monitor database instances, schemas, and sensitive data stores."
      phase="Discovery"
      icon={Database}
      features={[
        "Database instance discovery",
        "Schema and table enumeration",
        "Sensitive data classification",
        "Access control analysis",
        "Database encryption status",
      ]}
    />
  );
}
