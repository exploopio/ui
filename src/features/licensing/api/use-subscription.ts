/**
 * Subscription API Hooks
 *
 * SWR hooks for fetching tenant subscription and plan data.
 */

'use client'

import useSWR, { type SWRConfiguration } from 'swr'
import { get } from '@/lib/api/client'
import { handleApiError } from '@/lib/api/error-handler'

// ============================================
// TYPES
// ============================================

/**
 * Plan module with limits
 */
export interface PlanModule {
  module_id: string
  limits: Record<string, number>
}

/**
 * Subscription plan
 */
export interface Plan {
  id: string
  slug: string
  name: string
  description: string
  price_monthly: number | null
  price_yearly: number | null
  currency: string
  is_public: boolean
  is_popular: boolean
  is_active: boolean
  display_order: number
  features: string[]
  badge: string | null
  modules: PlanModule[]
}

/**
 * Tenant subscription
 */
export interface TenantSubscription {
  tenant_id: string
  plan_id: string
  plan: Plan
  status: 'active' | 'trial' | 'past_due' | 'cancelled' | 'expired'
  billing_cycle: 'monthly' | 'yearly'
  started_at: string
  expires_at: string | null
  cancelled_at: string | null
  limits_override: Record<string, number>
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

// ============================================
// CONFIGURATION
// ============================================

const subscriptionConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // Cache for 1 minute
  onError: (error) => {
    handleApiError(error, {
      showToast: false,
      logError: true,
    })
  },
}

const plansConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 300000, // Cache for 5 minutes - plans don't change often
  onError: (error) => {
    handleApiError(error, {
      showToast: false,
      logError: true,
    })
  },
}

// ============================================
// HOOKS
// ============================================

/**
 * Fetch tenant's current subscription
 *
 * @example
 * ```tsx
 * const { subscription, plan, isLoading } = useTenantSubscription();
 * console.log(subscription?.status); // 'active'
 * console.log(plan?.name); // 'Pro'
 * ```
 */
export function useTenantSubscription() {
  const { data, error, isLoading, mutate } = useSWR<TenantSubscription>(
    '/api/v1/me/subscription',
    async (url: string) => {
      try {
        return await get<TenantSubscription>(url)
      } catch {
        // Return null if endpoint not available
        return null as unknown as TenantSubscription
      }
    },
    subscriptionConfig
  )

  return {
    /** Full subscription object */
    subscription: data ?? null,
    /** Shortcut to subscription's plan */
    plan: data?.plan ?? null,
    /** Subscription status */
    status: data?.status ?? null,
    /** Whether subscription is active */
    isActive: data?.status === 'active' || data?.status === 'trial',
    /** Loading state */
    isLoading,
    /** Error object */
    error,
    /** Refetch function */
    mutate,
  }
}

/**
 * Fetch all available public plans
 *
 * @example
 * ```tsx
 * const { plans, isLoading } = usePlans();
 * plans.map(plan => (
 *   <PlanCard key={plan.id} plan={plan} />
 * ));
 * ```
 */
export function usePlans() {
  const { data, error, isLoading } = useSWR<Plan[]>(
    '/api/v1/plans',
    async (url: string) => {
      try {
        return await get<Plan[]>(url)
      } catch {
        return []
      }
    },
    plansConfig
  )

  return {
    /** Array of available plans */
    plans: data ?? [],
    /** Loading state */
    isLoading,
    /** Error object */
    error,
  }
}

/**
 * Fetch a specific plan by ID or slug
 *
 * @example
 * ```tsx
 * const { plan, isLoading } = usePlan('pro');
 * ```
 */
export function usePlan(planIdOrSlug: string | null) {
  const { data, error, isLoading } = useSWR<Plan>(
    planIdOrSlug ? `/api/v1/plans/${planIdOrSlug}` : null,
    async (url: string) => {
      try {
        return await get<Plan>(url)
      } catch {
        return null as unknown as Plan
      }
    },
    plansConfig
  )

  return {
    /** Plan object */
    plan: data ?? null,
    /** Loading state */
    isLoading,
    /** Error object */
    error,
  }
}

/**
 * Get module limit from current subscription
 *
 * @example
 * ```tsx
 * const { limit, isUnlimited, isLoading } = useModuleLimit('assets', 'max_items');
 * console.log(limit); // 500 or -1 for unlimited
 * ```
 */
export function useModuleLimit(moduleId: string, metric: string) {
  const { subscription, isLoading } = useTenantSubscription()

  // Check override first
  const overrideKey = `${moduleId}_${metric}`
  if (subscription?.limits_override?.[overrideKey] !== undefined) {
    const limit = subscription.limits_override[overrideKey]
    return {
      limit,
      isUnlimited: limit === -1,
      isLoading,
    }
  }

  // Check plan limits
  const planModule = subscription?.plan?.modules?.find(
    (pm) => pm.module_id === moduleId
  )
  const limit = planModule?.limits?.[metric] ?? -1

  return {
    /** The limit value (-1 = unlimited) */
    limit,
    /** Whether limit is unlimited */
    isUnlimited: limit === -1,
    /** Loading state */
    isLoading,
  }
}
