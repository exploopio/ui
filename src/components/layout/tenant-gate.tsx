"use client";

/**
 * Tenant Gate Component
 *
 * Guards the dashboard layout based on tenant status:
 * - If user has no tenant cookie: Redirect to onboarding page
 * - If user has tenant: Show normal dashboard layout with sidebar
 *
 * NOTE: Authentication is handled by proxy.ts (server-side)
 * TenantGate only handles tenant check for authenticated users
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/tenant-provider";
import { getCookie } from "@/lib/cookies";
import { Loader2 } from "lucide-react";

interface TenantGateProps {
  children: React.ReactNode;
}

// Loading UI component
function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function TenantGate({ children }: TenantGateProps) {
  const router = useRouter();
  const { tenants, isLoading, currentTenant, error } = useTenant();
  const [hasCheckedTenant, setHasCheckedTenant] = useState(false);

  // Check for tenant cookie on mount
  // NOTE: Authentication is handled by proxy.ts (server-side)
  // TenantGate only handles tenant selection for authenticated users

  useEffect(() => {
    const tenantCookie = getCookie("rediver_tenant");
    if (!tenantCookie) {
      console.log("[TenantGate] No tenant cookie found - redirecting to onboarding");
      window.location.href = "/onboarding/create-team";
      return;
    }
    setHasCheckedTenant(true);
  }, []);

  // Handle authentication errors
  useEffect(() => {
    if (error) {
      const isAuthError =
        (error as { statusCode?: number }).statusCode === 401 ||
        (error as { code?: string }).code === "UNAUTHORIZED" ||
        error.message?.toLowerCase().includes("unauthorized");

      if (isAuthError) {
        const hasTenantCookie = getCookie("rediver_tenant");
        if (hasTenantCookie) {
          // User had a tenant but token expired - redirect to login
          console.log("[TenantGate] Auth error with tenant cookie - redirecting to login");
          router.push("/login");
        } else {
          // User logged in but has no tenant - redirect to onboarding
          console.log("[TenantGate] Auth error, no tenant cookie - redirecting to onboarding");
          window.location.href = "/onboarding/create-team";
        }
      }
    }
  }, [error, router]);

  // Wait for initial tenant check
  if (!hasCheckedTenant) {
    return <LoadingScreen />;
  }

  // Show loading while fetching tenants
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Edge case: API returned empty tenants but user has token
  if (tenants.length === 0 && !currentTenant) {
    // Redirect to onboarding
    window.location.href = "/onboarding/create-team";
    return <LoadingScreen message="Redirecting..." />;
  }

  // User has tenants - show normal dashboard layout
  return <>{children}</>;
}
