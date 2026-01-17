"use client";

/**
 * Tenant Gate Component
 *
 * Guards the dashboard layout based on tenant status:
 * - If auth is invalid: Redirect to login page (clear cookies first)
 * - If user has no tenants: Redirect to onboarding page
 * - If user has tenant: Show normal dashboard layout with sidebar
 *
 * IMPORTANT: We MUST wait for API response before deciding where to redirect.
 * The proxy only checks if cookie exists, not if it's valid.
 * So we need to let the tenant API call happen first to validate auth.
 */

import { useEffect, useRef } from "react";
import { useTenant } from "@/context/tenant-provider";
import { getCookie, removeCookie } from "@/lib/cookies";
import { env } from "@/lib/env";
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

/**
 * Check if error is an authentication error
 */
function isAuthError(error: Error): boolean {
  const statusCode = (error as { statusCode?: number }).statusCode;
  const code = (error as { code?: string }).code;
  const message = error.message?.toLowerCase() || "";

  return (
    statusCode === 401 ||
    statusCode === 403 ||
    code === "UNAUTHORIZED" ||
    code === "UNAUTHENTICATED" ||
    message.includes("unauthorized") ||
    message.includes("unauthenticated") ||
    message.includes("invalid token") ||
    message.includes("expired token") ||
    message.includes("invalid refresh token") ||
    message.includes("session expired") ||
    message.includes("not authenticated") ||
    message.includes("authentication failed")
  );
}

/**
 * Clear auth cookies and redirect to login
 *
 * NOTE: We only clear auth tokens, NOT the tenant cookie.
 * This preserves the user's team selection so when they log in again,
 * they'll automatically be in the same team.
 *
 * We also cannot clear HttpOnly cookies from client-side JavaScript.
 * The server will handle clearing those via the refresh route or login page.
 */
function clearAuthAndRedirectToLogin() {
  console.log("[TenantGate] Auth error detected, redirecting to login");

  // Clear non-HttpOnly auth cookies (if any)
  // Note: HttpOnly cookies (access_token, refresh_token) cannot be cleared from JS
  // The server will handle clearing those when the user tries to use them
  removeCookie(env.auth.cookieName);

  // DO NOT clear tenant cookie - preserve user's team selection
  // This way when they log back in, they'll be in the same team

  // Use hard redirect to ensure clean state
  window.location.href = "/login";
}

export function TenantGate({ children }: TenantGateProps) {
  const { tenants, isLoading, currentTenant, error } = useTenant();
  const hasRedirected = useRef(false);

  // Handle authentication errors - HIGHEST PRIORITY
  // When token is invalid, API will return 401 - redirect to login
  useEffect(() => {
    if (error && !hasRedirected.current) {
      if (isAuthError(error)) {
        hasRedirected.current = true;
        clearAuthAndRedirectToLogin();
      }
    }
  }, [error]);

  // Handle tenant check AFTER API response
  // Only redirect to onboarding if:
  // 1. API call completed (not loading)
  // 2. No auth error (error is null or not auth error)
  // 3. User has no tenants
  useEffect(() => {
    // Wait for API to complete
    if (isLoading) return;

    // If there's an auth error, let the auth error handler deal with it
    if (error && isAuthError(error)) return;

    // Already redirected
    if (hasRedirected.current) return;

    // Check if user has no tenants - redirect to onboarding
    // This means auth is valid but user hasn't created a team yet
    if (tenants.length === 0 && !currentTenant) {
      hasRedirected.current = true;
      console.log("[TenantGate] No tenants found - redirecting to onboarding");
      window.location.href = "/onboarding/create-team";
      return;
    }

    // Check if user has tenants but no tenant cookie selected
    // This can happen if cookie was cleared but auth is still valid
    if (tenants.length > 0 && !currentTenant) {
      const tenantCookie = getCookie(env.cookies.tenant);
      if (!tenantCookie) {
        // Auto-select the first tenant
        console.log("[TenantGate] No tenant selected, but has tenants - selecting first one");
        // This will be handled by the first tenant selection flow
      }
    }
  }, [isLoading, error, tenants.length, currentTenant]);

  // Show loading while API is fetching (validating auth)
  if (isLoading) {
    return <LoadingScreen message="Verifying..." />;
  }

  // Show loading if auth error (will redirect to login)
  if (error && isAuthError(error)) {
    return <LoadingScreen message="Session expired..." />;
  }

  // Show loading while redirecting for empty tenants
  if (tenants.length === 0 && !currentTenant) {
    return <LoadingScreen message="Redirecting..." />;
  }

  // User has tenants - show normal dashboard layout
  return <>{children}</>;
}
