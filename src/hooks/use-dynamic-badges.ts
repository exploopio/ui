/**
 * Dynamic Sidebar Badges Hook
 *
 * Fetches real counts from API to replace hardcoded badge values in sidebar.
 * Uses optimized caching to minimize API calls.
 */

'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import { get } from '@/lib/api/client'
import { useTenant } from '@/context/tenant-provider'
import { useAssetGroupStatsApi } from '@/features/asset-groups/api'
import { useCredentialStatsApi } from '@/features/credentials/api'

// ============================================
// TYPES
// ============================================

export interface DynamicBadges {
    /** Map of URL path to badge value */
    [key: string]: string | undefined
}

interface DashboardStats {
    findings: {
        total: number
        by_severity: Record<string, number>
        by_status: Record<string, number>
        overdue: number
    }
    assets: {
        total: number
    }
}

// ============================================
// HOOKS
// ============================================

/**
 * Fetch dashboard stats for badge counts
 * Uses long cache since badge counts don't need real-time accuracy
 * Note: Tenant is extracted from JWT token by backend, not from URL
 */
function useDashboardStatsForBadges() {
    const { currentTenant } = useTenant()

    // Only fetch when we have a tenant (ensures JWT has tenant context)
    const key = currentTenant?.id ? '/api/v1/dashboard/stats' : null

    return useSWR<DashboardStats>(
        key,
        (url: string) => get<DashboardStats>(url),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000, // 60s cache - badges don't need real-time
            errorRetryCount: 1,
        }
    )
}

/**
 * Hook to get dynamic badge values for sidebar navigation.
 * Returns a map of URL path to badge count.
 *
 * @example
 * const badges = useDynamicBadges()
 * // badges = { '/asset-groups': '12', '/findings': '24', ... }
 */
export function useDynamicBadges(): DynamicBadges {
    // Fetch asset group stats
    const { data: assetGroupStats } = useAssetGroupStatsApi({
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    })

    // Fetch dashboard stats for findings count
    const { data: dashboardStats } = useDashboardStatsForBadges()

    // Fetch credential stats for credential leaks badge
    const { data: credentialStats } = useCredentialStatsApi({
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    })

    const badges = useMemo(() => {
        const result: DynamicBadges = {}

        // Asset Groups badge - show total count
        if (assetGroupStats?.total !== undefined && assetGroupStats.total > 0) {
            result['/asset-groups'] = String(assetGroupStats.total)
        }

        // Findings badge - show open findings count (exclude resolved/closed)
        if (dashboardStats?.findings) {
            const { by_status, total } = dashboardStats.findings
            // Calculate open findings (total - resolved - closed)
            const resolved = by_status?.resolved || 0
            const closed = by_status?.closed || 0
            const verified = by_status?.verified || 0
            const openCount = total - resolved - closed - verified

            if (openCount > 0) {
                result['/findings'] = String(openCount)
            }
        }

        // Credential Leaks badge - show active credential leak count
        if (credentialStats?.by_state) {
            const activeCount = credentialStats.by_state.active || 0
            if (activeCount > 0) {
                result['/credentials'] = String(activeCount)
            }
        }

        return result
    }, [assetGroupStats, dashboardStats, credentialStats])

    return badges
}

/**
 * Get badge value for a specific URL.
 * If dynamic badge exists, return it. Otherwise return static badge.
 */
export function getBadgeValue(
    badges: DynamicBadges,
    url: string,
    staticBadge?: string
): string | undefined {
    // Prefer dynamic badge if available
    if (badges[url] !== undefined) {
        return badges[url]
    }
    // Fall back to static badge
    return staticBadge
}
