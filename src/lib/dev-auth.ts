/**
 * Development Authentication Helpers
 *
 * Provides mock authentication for development/testing purposes.
 * This should NEVER be used in production.
 */

import type { AuthUser } from "@/lib/keycloak";

// Mock user data for development (admin role with full permissions)
export const DEV_USER: AuthUser = {
  id: "dev-001",
  email: "admin@rediver.io",
  name: "Nguyen Van An",
  username: "admin",
  emailVerified: true,
  roles: ["admin", "security_analyst"],
  realmRoles: ["admin"],
  clientRoles: { "ui": ["admin", "security_analyst"] },
  // Permissions for admin role
  permissions: [
    "assets:read", "assets:write", "assets:delete",
    "projects:read", "projects:write", "projects:delete",
    "components:read", "components:write", "components:delete",
    "findings:read", "findings:write", "findings:delete",
    "vulnerabilities:read",
    "dashboard:read",
    "scans:read", "scans:write",
    "credentials:read", "credentials:write",
    "reports:read", "reports:write",
    "pentest:read", "pentest:write",
    "remediation:read", "remediation:write",
    "workflows:read", "workflows:write",
    "members:read", "members:invite", "members:manage",
    "team:read", "team:update",
    "billing:read",
    "integrations:read", "integrations:manage",
  ],
  tenantId: "dev-tenant-001",
  tenantRole: "admin",
};

// Mock credentials
export const DEV_CREDENTIALS = {
  email: "admin@rediver.io",
  password: "admin123",
};

/**
 * Generate a mock JWT token for development
 * This is NOT a real JWT - it's just for bypassing auth in dev mode
 *
 * The token structure matches Keycloak's access token format
 * so it can be parsed by extractUser() in jwt.ts
 */
export function generateDevToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 86400; // 24 hours from now

  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      // Standard JWT claims
      sub: DEV_USER.id,
      iat: now,
      exp: exp,
      iss: "dev-issuer",
      aud: "ui",

      // Keycloak-specific claims
      email: DEV_USER.email,
      email_verified: DEV_USER.emailVerified,
      name: DEV_USER.name,
      preferred_username: DEV_USER.username,

      // Roles
      realm_access: { roles: DEV_USER.realmRoles },
      resource_access: {
        "ui": { roles: DEV_USER.roles },
      },

      // Permissions and tenant context
      permissions: DEV_USER.permissions,
      tenant: DEV_USER.tenantId,
      role: DEV_USER.tenantRole,
    })
  );
  const signature = btoa("dev-signature");

  return `${header}.${payload}.${signature}`;
}

/**
 * Validate dev credentials
 */
export function validateDevCredentials(
  email: string,
  password: string
): boolean {
  return (
    email === DEV_CREDENTIALS.email && password === DEV_CREDENTIALS.password
  );
}

/**
 * Check if dev auth is enabled
 */
export function isDevAuthEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Dev auth cookie name
 */
export const DEV_AUTH_COOKIE = "dev_auth_token";

/**
 * Set dev auth cookie (for middleware/proxy to recognize)
 */
export function setDevAuthCookie(): void {
  if (typeof document !== "undefined") {
    const token = generateDevToken();
    // Set cookie that expires in 24 hours
    const expires = new Date(Date.now() + 86400 * 1000).toUTCString();
    document.cookie = `${DEV_AUTH_COOKIE}=${token}; path=/; expires=${expires}; SameSite=Lax`;
  }
}

/**
 * Clear dev auth cookie
 */
export function clearDevAuthCookie(): void {
  if (typeof document !== "undefined") {
    document.cookie = `${DEV_AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}
