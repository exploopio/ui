/**
 * UpgradePrompt Component
 *
 * Displays a call-to-action to upgrade the subscription plan.
 * Used by ModuleGate when a module is not available.
 *
 * @example
 * ```tsx
 * // Card variant (default) - full width card with centered content
 * <UpgradePrompt module="compliance" />
 *
 * // Banner variant - horizontal banner at top of page
 * <UpgradePrompt module="scans" variant="banner" />
 *
 * // Inline variant - minimal inline message
 * <UpgradePrompt module="reports" variant="inline" />
 * ```
 */

'use client'

import { Lock, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ============================================
// MODULE DISPLAY INFO
// ============================================

const MODULE_INFO: Record<string, { name: string; description: string }> = {
  dashboard: {
    name: 'Dashboard',
    description: 'Overview and analytics dashboard',
  },
  assets: {
    name: 'Asset Management',
    description: 'Manage and inventory your assets',
  },
  findings: {
    name: 'Vulnerability Findings',
    description: 'View and manage security vulnerabilities',
  },
  scans: {
    name: 'Security Scanning',
    description: 'Configure and run security scans',
  },
  agents: {
    name: 'Security Agents',
    description: 'Deploy and manage scanning agents',
  },
  reports: {
    name: 'Reports & Analytics',
    description: 'Generate comprehensive security reports',
  },
  compliance: {
    name: 'Compliance Management',
    description: 'Track compliance with security frameworks',
  },
  integrations: {
    name: 'Integrations',
    description: 'Connect with third-party tools and services',
  },
  notifications: {
    name: 'Notifications',
    description: 'Configure alerts and notification channels',
  },
  groups: {
    name: 'Access Groups',
    description: 'Organize users and control data access',
  },
  roles: {
    name: 'Custom Roles',
    description: 'Create custom roles with specific permissions',
  },
  audit: {
    name: 'Audit Logs',
    description: 'Security audit trail and activity logs',
  },
  billing: {
    name: 'Billing Management',
    description: 'Manage subscription and billing',
  },
}

// ============================================
// TYPES
// ============================================

interface UpgradePromptProps {
  /**
   * Module ID that is locked
   */
  module: string

  /**
   * Custom module name (overrides default)
   */
  moduleName?: string

  /**
   * Custom description (overrides default)
   */
  description?: string

  /**
   * Visual variant
   * @default 'card'
   */
  variant?: 'card' | 'banner' | 'inline'

  /**
   * Additional CSS classes
   */
  className?: string
}

// ============================================
// COMPONENT
// ============================================

export function UpgradePrompt({
  module,
  moduleName,
  description,
  variant = 'card',
  className,
}: UpgradePromptProps) {
  const info = MODULE_INFO[module] || { name: module, description: '' }
  const displayName = moduleName || info.name
  const displayDescription = description || info.description

  // Banner variant - horizontal at top
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent',
          'border border-primary/20 rounded-lg p-4',
          className
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">
              Upgrade to unlock {displayName}
            </p>
            {displayDescription && (
              <p className="text-sm text-muted-foreground truncate">
                {displayDescription}
              </p>
            )}
          </div>
          <Button asChild size="sm">
            <Link href="/settings/billing">
              View Plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Inline variant - minimal
  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-muted-foreground',
          className
        )}
      >
        <Lock className="h-4 w-4" />
        <span>
          {displayName} is not available on your current plan.{' '}
          <Link
            href="/settings/billing"
            className="text-primary hover:underline font-medium"
          >
            Upgrade
          </Link>
        </span>
      </div>
    )
  }

  // Card variant (default) - centered card
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="relative mb-6">
          <div className="p-4 bg-muted rounded-full">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="absolute -top-1 -right-1 p-1 bg-primary rounded-full">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-2">
          {displayName} Not Available
        </h3>

        <p className="text-muted-foreground mb-6 max-w-md">
          {displayDescription ||
            'This feature is not available on your current plan. Upgrade to access this and more advanced features.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link href="/settings/billing">
              <Sparkles className="mr-2 h-4 w-4" />
              View Plans
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/settings/billing#compare">Compare Features</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// EXPORTS
// ============================================

export type { UpgradePromptProps }
export default UpgradePrompt
