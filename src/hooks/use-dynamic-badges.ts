/**
 * Dynamic Sidebar Badges Hook
 *
 * Fetches real counts from API to replace hardcoded badge values in sidebar.
 * Endpoints like asset-groups/stats provide the actual counts.
 */

'use client'

import { useMemo } from 'react'
import { useAssetGroupStatsApi } from '@/features/asset-groups/api'

export interface DynamicBadges {
    /** Map of URL path to badge value */
    [key: string]: string | undefined
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
    const { data: assetGroupStats } = useAssetGroupStatsApi()

    // We would add more stats hooks here for different sections
    // const { data: findingsStats } = useFindingsStatsApi()
    // const { data: remediationStats } = useRemediationStatsApi()

    const badges = useMemo(() => {
        const result: DynamicBadges = {}

        // Asset Groups badge - show total count
        if (assetGroupStats?.total !== undefined && assetGroupStats.total > 0) {
            result['/asset-groups'] = String(assetGroupStats.total)
        }

        // TODO: Add more dynamic badges as needed
        // result['/findings'] = findingsStats?.open?.toString()
        // result['/remediation'] = remediationStats?.pending?.toString()
        // result['/credentials'] = credentialStats?.exposed?.toString()

        return result
    }, [assetGroupStats])

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
