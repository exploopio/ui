/**
 * Member Management API Hooks
 *
 * SWR hooks for managing team members and invitations
 */

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { tenantEndpoints } from '@/lib/api/endpoints'
import { fetcher, fetcherWithOptions } from '@/lib/api/client'
import { usePermissions, Permission } from '@/lib/permissions'
import type {
  MemberListResponse,
  MemberStats,
  InvitationListResponse,
  Invitation,
  CreateInvitationInput,
  UpdateMemberRoleInput,
  MemberWithUser,
} from '../types/member.types'

// ============================================
// FETCH MEMBERS
// ============================================

/**
 * Hook to fetch team members with user details
 * Only fetches if user has members:read permission
 */
export function useMembers(tenantIdOrSlug: string | undefined) {
  const { can } = usePermissions()
  const canReadMembers = can(Permission.MembersRead)

  // Only fetch if user has permission
  const shouldFetch = tenantIdOrSlug && canReadMembers

  const { data, error, isLoading, mutate } = useSWR<MemberListResponse>(
    shouldFetch ? `${tenantEndpoints.members(tenantIdOrSlug)}?include=user` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  return {
    members: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading: shouldFetch ? isLoading : false,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook to fetch member statistics
 * Only fetches if user has members:read permission
 */
export function useMemberStats(tenantIdOrSlug: string | undefined) {
  const { can } = usePermissions()
  const canReadMembers = can(Permission.MembersRead)

  // Only fetch if user has permission
  const shouldFetch = tenantIdOrSlug && canReadMembers

  const { data, error, isLoading, mutate } = useSWR<MemberStats>(
    shouldFetch ? tenantEndpoints.memberStats(tenantIdOrSlug) : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  return {
    stats: data,
    isLoading: shouldFetch ? isLoading : false,
    isError: !!error,
    error,
    mutate,
  }
}

// ============================================
// MEMBER MUTATIONS
// ============================================

async function updateMemberRole(
  url: string,
  { arg }: { arg: UpdateMemberRoleInput }
) {
  return fetcherWithOptions<MemberWithUser>(url, {
    method: 'PATCH',
    body: JSON.stringify(arg),
  })
}

/**
 * Hook to update a member's role
 */
export function useUpdateMemberRole(tenantIdOrSlug: string | undefined, memberId: string | undefined) {
  const { trigger, isMutating, error } = useSWRMutation(
    tenantIdOrSlug && memberId
      ? tenantEndpoints.updateMember(tenantIdOrSlug, memberId)
      : null,
    updateMemberRole
  )

  return {
    updateRole: trigger,
    isUpdating: isMutating,
    error,
  }
}

async function removeMember(url: string) {
  return fetcherWithOptions<void>(url, {
    method: 'DELETE',
  })
}

/**
 * Hook to remove a member
 */
export function useRemoveMember(tenantIdOrSlug: string | undefined, memberId: string | undefined) {
  const { trigger, isMutating, error } = useSWRMutation(
    tenantIdOrSlug && memberId
      ? tenantEndpoints.removeMember(tenantIdOrSlug, memberId)
      : null,
    removeMember
  )

  return {
    removeMember: trigger,
    isRemoving: isMutating,
    error,
  }
}

// ============================================
// FETCH INVITATIONS
// ============================================

/**
 * Hook to fetch pending invitations
 * Only fetches if user has members:invite or members:manage permission
 */
export function useInvitations(tenantIdOrSlug: string | undefined) {
  const { canAny } = usePermissions()
  const canManageInvitations = canAny(Permission.MembersInvite, Permission.MembersManage)

  // Only fetch if user has permission
  const shouldFetch = tenantIdOrSlug && canManageInvitations

  const { data, error, isLoading, mutate } = useSWR<InvitationListResponse>(
    shouldFetch ? tenantEndpoints.invitations(tenantIdOrSlug) : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  return {
    invitations: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading: shouldFetch ? isLoading : false,
    isError: !!error,
    error,
    mutate,
  }
}

// ============================================
// INVITATION MUTATIONS
// ============================================

async function createInvitation(
  url: string,
  { arg }: { arg: CreateInvitationInput }
) {
  return fetcherWithOptions<Invitation>(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

/**
 * Hook to create an invitation
 */
export function useCreateInvitation(tenantIdOrSlug: string | undefined) {
  const { trigger, isMutating, error } = useSWRMutation(
    tenantIdOrSlug ? tenantEndpoints.createInvitation(tenantIdOrSlug) : null,
    createInvitation
  )

  return {
    createInvitation: trigger,
    isCreating: isMutating,
    error,
  }
}

async function deleteInvitation(url: string) {
  return fetcherWithOptions<void>(url, {
    method: 'DELETE',
  })
}

/**
 * Hook to delete/cancel an invitation
 */
export function useDeleteInvitation(tenantIdOrSlug: string | undefined, invitationId: string | undefined) {
  const { trigger, isMutating, error } = useSWRMutation(
    tenantIdOrSlug && invitationId
      ? tenantEndpoints.deleteInvitation(tenantIdOrSlug, invitationId)
      : null,
    deleteInvitation
  )

  return {
    deleteInvitation: trigger,
    isDeleting: isMutating,
    error,
  }
}

// ============================================
// CACHE KEYS
// ============================================

/**
 * Get the SWR key for members list
 */
export function getMembersKey(tenantIdOrSlug: string) {
  return `${tenantEndpoints.members(tenantIdOrSlug)}?include=user`
}

/**
 * Get the SWR key for member stats
 */
export function getMemberStatsKey(tenantIdOrSlug: string) {
  return tenantEndpoints.memberStats(tenantIdOrSlug)
}

/**
 * Get the SWR key for invitations
 */
export function getInvitationsKey(tenantIdOrSlug: string) {
  return tenantEndpoints.invitations(tenantIdOrSlug)
}
