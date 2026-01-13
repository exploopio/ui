'use client'

/**
 * Can Component
 *
 * Declarative component for permission-based rendering.
 * Renders children only if user has the required permission(s).
 *
 * @example
 * ```tsx
 * // Single permission
 * <Can permission="assets:write">
 *   <CreateAssetButton />
 * </Can>
 *
 * // Multiple permissions (any)
 * <Can permission={['assets:write', 'projects:write']}>
 *   <WriteToolbar />
 * </Can>
 *
 * // With fallback
 * <Can permission="assets:delete" fallback={<DisabledButton />}>
 *   <DeleteButton />
 * </Can>
 * ```
 */

import type { ReactNode } from 'react'
import { usePermissions } from './hooks'
import { type PermissionString } from './constants'

interface CanProps {
  /**
   * Permission(s) required to render children.
   * If array, user needs ANY of the permissions (OR logic).
   */
  permission: PermissionString | string | (PermissionString | string)[]

  /**
   * If true, user needs ALL permissions (AND logic).
   * Only applies when permission is an array.
   * @default false
   */
  requireAll?: boolean

  /**
   * Content to render when user has permission
   */
  children: ReactNode

  /**
   * Content to render when user lacks permission
   * @default null
   */
  fallback?: ReactNode
}

/**
 * Permission-based conditional rendering component
 */
export function Can({
  permission,
  requireAll = false,
  children,
  fallback = null,
}: CanProps): ReactNode {
  const { can, canAny, canAll } = usePermissions()

  let hasPermission: boolean

  if (Array.isArray(permission)) {
    hasPermission = requireAll ? canAll(...permission) : canAny(...permission)
  } else {
    hasPermission = can(permission)
  }

  return hasPermission ? children : fallback
}

/**
 * Cannot Component - Inverse of Can
 * Renders children only if user does NOT have the permission
 *
 * @example
 * ```tsx
 * <Cannot permission="assets:write">
 *   <ReadOnlyBanner />
 * </Cannot>
 * ```
 */
interface CannotProps {
  permission: PermissionString | string | (PermissionString | string)[]
  requireAll?: boolean
  children: ReactNode
  fallback?: ReactNode
}

export function Cannot({
  permission,
  requireAll = false,
  children,
  fallback = null,
}: CannotProps): ReactNode {
  const { can, canAny, canAll } = usePermissions()

  let hasPermission: boolean

  if (Array.isArray(permission)) {
    hasPermission = requireAll ? canAll(...permission) : canAny(...permission)
  } else {
    hasPermission = can(permission)
  }

  return hasPermission ? fallback : children
}
