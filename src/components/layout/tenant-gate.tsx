"use client";

/**
 * Tenant Gate Component
 *
 * Guards the dashboard layout based on tenant status:
 * - If user has no tenants: Show only Create Team page (no sidebar)
 * - If user has tenants: Show normal dashboard layout with sidebar
 * - If no access token (new user): Show Create Team directly
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/tenant-provider";
import { getCookie } from "@/lib/cookies";
import { Loader2, LogOut } from "lucide-react";
import { CreateTeamForm } from "@/features/tenant";
import { Button } from "@/components/ui/button";
import { localLogoutAction } from "@/features/auth/actions/local-auth-actions";

interface TenantGateProps {
  children: React.ReactNode;
}

// Create Team UI component (extracted to avoid duplication)
function CreateTeamPage({ suggestedName = '' }: { suggestedName?: string }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await localLogoutAction('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Redirect to login anyway
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Simple header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              R
            </div>
            <span className="font-semibold">Rediver</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Logout
          </Button>
        </div>
      </header>

      {/* Create Team Content */}
      <main className="flex-1">
        <div className="container py-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome to Rediver
              </h1>
              <p className="mt-2 text-muted-foreground">
                Create your first team to get started with security management
              </p>
            </div>

            <div className="flex justify-center">
              <CreateTeamForm showCancel={false} isFirstTeam={true} suggestedName={suggestedName} />
            </div>
          </div>
        </div>
      </main>

      {/* Simple footer */}
      <footer className="border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          Rediver Security Platform
        </div>
      </footer>
    </div>
  );
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

// Helper to extract user name from cookie
function getUserNameFromCookie(): string {
  try {
    const userInfoCookie = getCookie("rediver_user_info");
    if (userInfoCookie) {
      const userInfo = JSON.parse(userInfoCookie);
      return userInfo.name || '';
    }
  } catch (error) {
    console.error("[TenantGate] Failed to parse user info cookie:", error);
  }
  return '';
}

export function TenantGate({ children }: TenantGateProps) {
  const router = useRouter();
  const { tenants, isLoading, currentTenant, error } = useTenant();
  const [hasCheckedToken, setHasCheckedToken] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [suggestedName, setSuggestedName] = useState('');

  // Check for tenant cookie on mount - syncing with external storage
  // New users without tenants won't have this cookie
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const tenantCookie = getCookie("rediver_tenant");
    if (!tenantCookie) {
      console.log("[TenantGate] No tenant cookie found - showing create team");
      // Get suggested name from user info cookie
      const userName = getUserNameFromCookie();
      if (userName) {
        setSuggestedName(userName);
        console.log("[TenantGate] Suggested team name from user:", userName);
      }
      setShowCreateTeam(true);
    }
    setHasCheckedToken(true);
  }, []);

  // Handle authentication errors - syncing with external state
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (error && !showCreateTeam) {
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
          // User logged in but has no tenant - show create team
          console.log("[TenantGate] Auth error, no tenant cookie - showing create team");
          // Get suggested name from user info cookie
          const userName = getUserNameFromCookie();
          if (userName) {
            setSuggestedName(userName);
          }
          setShowCreateTeam(true);
        }
      }
    }
  }, [error, showCreateTeam, router]);

  // Wait for initial token check
  if (!hasCheckedToken) {
    return <LoadingScreen />;
  }

  // User has no tenant - show Create Team page
  if (showCreateTeam) {
    return <CreateTeamPage suggestedName={suggestedName} />;
  }

  // Show loading while fetching tenants
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Edge case: API returned empty tenants but user has token
  if (tenants.length === 0 && !currentTenant) {
    return <CreateTeamPage suggestedName={suggestedName} />;
  }

  // User has tenants - show normal dashboard layout
  return <>{children}</>;
}
