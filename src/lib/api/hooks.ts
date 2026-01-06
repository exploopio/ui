/**
 * API Hooks
 *
 * Custom React hooks for data fetching using SWR
 * Examples and utilities for common API operations
 */

'use client'

import useSWR, { type SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'
import useSWRInfinite from 'swr/infinite'
import { get, post, put, del, uploadFile } from './client'
import { handleApiError } from './error-handler'
import { endpoints } from './endpoints'
import type {
  User,
  Post,
  CreateUserRequest,
  UpdateUserRequest,
  CreatePostRequest,
  UpdatePostRequest,
  UserListFilters,
  SearchFilters,
  PaginatedResponse,
  FileUploadResponse,
} from './types'

// ============================================
// SWR CONFIGURATION
// ============================================

/**
 * Default SWR configuration
 */
export const defaultSwrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  dedupingInterval: 2000,
  onError: (error) => {
    handleApiError(error, {
      showToast: true,
      logError: true,
    })
  },
}

// ============================================
// USER HOOKS
// ============================================

/**
 * Fetch current user profile
 *
 * @example
 * ```typescript
 * function ProfilePage() {
 *   const { data: user, error, isLoading } = useCurrentUser()
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error error={error} />
 *
 *   return <div>Welcome, {user.name}!</div>
 * }
 * ```
 */
export function useCurrentUser(config?: SWRConfiguration) {
  return useSWR<User>(
    endpoints.auth.me(),
    get,
    { ...defaultSwrConfig, ...config }
  )
}

/**
 * Fetch user by ID
 *
 * @example
 * ```typescript
 * const { data: user } = useUser('user-123')
 * ```
 */
export function useUser(userId: string | null, config?: SWRConfiguration) {
  return useSWR<User>(
    userId ? endpoints.users.get(userId) : null,
    get,
    { ...defaultSwrConfig, ...config }
  )
}

/**
 * Fetch users list with pagination and filters
 *
 * @example
 * ```typescript
 * const { data, error, isLoading } = useUsers({
 *   page: 1,
 *   pageSize: 10,
 *   search: 'john',
 *   role: 'admin'
 * })
 * ```
 */
export function useUsers(
  filters?: UserListFilters,
  config?: SWRConfiguration
) {
  return useSWR<PaginatedResponse<User>>(
    endpoints.users.list(filters),
    get,
    { ...defaultSwrConfig, ...config }
  )
}

/**
 * Create user mutation
 *
 * @example
 * ```typescript
 * function CreateUserForm() {
 *   const { trigger, isMutating } = useCreateUser()
 *
 *   const handleSubmit = async (data) => {
 *     try {
 *       const newUser = await trigger(data)
 *       toast.success('User created!')
 *     } catch (error) {
 *       // Error already handled by SWR
 *     }
 *   }
 *
 *   return <form onSubmit={handleSubmit}>...</form>
 * }
 * ```
 */
export function useCreateUser() {
  return useSWRMutation(
    endpoints.users.create(),
    (url, { arg }: { arg: CreateUserRequest }) => post<User>(url, arg)
  )
}

/**
 * Update user mutation
 */
export function useUpdateUser(userId: string) {
  return useSWRMutation(
    endpoints.users.update(userId),
    (url, { arg }: { arg: UpdateUserRequest }) => put<User>(url, arg)
  )
}

/**
 * Delete user mutation
 */
export function useDeleteUser(userId: string) {
  return useSWRMutation(
    endpoints.users.delete(userId),
    (url) => del(url)
  )
}

// ============================================
// POST HOOKS
// ============================================

/**
 * Fetch posts list with pagination and filters
 *
 * @example
 * ```typescript
 * const { data: posts } = usePosts({ page: 1, pageSize: 10 })
 * ```
 */
export function usePosts(
  filters?: SearchFilters,
  config?: SWRConfiguration
) {
  return useSWR<PaginatedResponse<Post>>(
    endpoints.posts.list(filters),
    get,
    { ...defaultSwrConfig, ...config }
  )
}

/**
 * Fetch post by ID
 */
export function usePost(postId: string | null, config?: SWRConfiguration) {
  return useSWR<Post>(
    postId ? endpoints.posts.get(postId) : null,
    get,
    { ...defaultSwrConfig, ...config }
  )
}

/**
 * Create post mutation
 */
export function useCreatePost() {
  return useSWRMutation(
    endpoints.posts.create(),
    (url, { arg }: { arg: CreatePostRequest }) => post<Post>(url, arg)
  )
}

/**
 * Update post mutation
 */
export function useUpdatePost(postId: string) {
  return useSWRMutation(
    endpoints.posts.update(postId),
    (url, { arg }: { arg: UpdatePostRequest }) => put<Post>(url, arg)
  )
}

/**
 * Delete post mutation
 */
export function useDeletePost(postId: string) {
  return useSWRMutation(
    endpoints.posts.delete(postId),
    (url) => del(url)
  )
}

/**
 * Publish post mutation
 */
export function usePublishPost(postId: string) {
  return useSWRMutation(
    endpoints.posts.publish(postId),
    (url) => post<Post>(url)
  )
}

// ============================================
// FILE UPLOAD HOOKS
// ============================================

/**
 * Upload file mutation
 *
 * @example
 * ```typescript
 * function FileUploader() {
 *   const { trigger, isMutating, progress } = useUploadFile()
 *   const [uploadProgress, setUploadProgress] = useState(0)
 *
 *   const handleUpload = async (file: File) => {
 *     try {
 *       const result = await trigger({
 *         file,
 *         onProgress: (p) => setUploadProgress(p.percentage)
 *       })
 *       toast.success('File uploaded!')
 *     } catch (error) {
 *       // Error handled by SWR
 *     }
 *   }
 *
 *   return <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
 * }
 * ```
 */
export function useUploadFile() {
  return useSWRMutation(
    endpoints.files.upload(),
    (
      url,
      { arg }: {
        arg: {
          file: File
          onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
        }
      }
    ) => uploadFile<FileUploadResponse>(url, arg.file, { onProgress: arg.onProgress })
  )
}

// ============================================
// PROFILE HOOKS
// ============================================

/**
 * Fetch current user's profile
 * (Alias for useCurrentUser for clarity)
 */
export function useProfile(config?: SWRConfiguration) {
  return useSWR<User>(
    endpoints.profile.get(),
    get,
    { ...defaultSwrConfig, ...config }
  )
}

/**
 * Update profile mutation
 */
export function useUpdateProfile() {
  return useSWRMutation(
    endpoints.profile.update(),
    (url, { arg }: { arg: UpdateUserRequest }) => put<User>(url, arg)
  )
}

/**
 * Upload avatar mutation
 */
export function useUploadAvatar() {
  return useSWRMutation(
    endpoints.profile.uploadAvatar(),
    (
      url,
      { arg }: {
        arg: {
          file: File
          onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
        }
      }
    ) => uploadFile<FileUploadResponse>(url, arg.file, { onProgress: arg.onProgress })
  )
}

// ============================================
// UTILITIES
// ============================================

/**
 * Mutate (revalidate) multiple SWR keys
 *
 * @example
 * ```typescript
 * // After creating a user, refresh user list
 * await mutateMultiple([
 *   endpoints.users.list(),
 *   endpoints.auth.me()
 * ])
 * ```
 */
export async function mutateMultiple(keys: string[]) {
  const { mutate } = await import('swr')
  await Promise.all(keys.map(key => mutate(key)))
}

/**
 * Clear all SWR cache
 */
export async function clearAllCache() {
  const { mutate } = await import('swr')
  await mutate(() => true, undefined, { revalidate: false })
}

/**
 * Create optimistic update helper
 *
 * @example
 * ```typescript
 * const updateUser = useUpdateUser('user-123')
 *
 * await optimisticUpdate(
 *   endpoints.users.get('user-123'),
 *   { name: 'New Name' },
 *   () => updateUser.trigger({ name: 'New Name' })
 * )
 * ```
 */
export async function optimisticUpdate<T>(
  key: string,
  optimisticData: T,
  updateFn: () => Promise<T>
) {
  const { mutate } = await import('swr')

  await mutate(
    key,
    updateFn(),
    {
      optimisticData,
      rollbackOnError: true,
      revalidate: false,
    }
  )
}

// ============================================
// ADVANCED HOOKS
// ============================================

/**
 * Infinite scroll hook for paginated data
 *
 * @example
 * ```typescript
 * const {
 *   data,
 *   size,
 *   setSize,
 *   isLoading,
 *   isValidating
 * } = useInfiniteUsers({ pageSize: 20 })
 *
 * // Load more
 * <button onClick={() => setSize(size + 1)}>Load More</button>
 * ```
 */
export function useInfiniteUsers(filters?: UserListFilters) {
  return useSWRInfinite(
    (pageIndex: number) =>
      endpoints.users.list({ ...filters, page: pageIndex + 1 }),
    get,
    defaultSwrConfig
  )
}

/**
 * Dependent fetching - fetch data only when condition is met
 *
 * @example
 * ```typescript
 * const { data: user } = useUser(userId)
 * const { data: posts } = useDependentData(
 *   user?.id,
 *   (id) => endpoints.users.posts(id),
 *   get
 * )
 * ```
 */
export function useDependentData<T, C = unknown>(
  condition: C,
  keyFn: (condition: NonNullable<C>) => string,
  fetcher: (key: string) => Promise<T>,
  config?: SWRConfiguration
) {
  return useSWR<T>(
    condition ? keyFn(condition as NonNullable<C>) : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  )
}

/**
 * Polling hook - automatically refetch data at interval
 *
 * @example
 * ```typescript
 * // Refresh every 5 seconds
 * const { data } = usePolling(
 *   endpoints.auth.me(),
 *   get,
 *   5000
 * )
 * ```
 */
export function usePolling<T>(
  key: string | null,
  fetcher: (key: string) => Promise<T>,
  interval: number = 5000,
  config?: SWRConfiguration
) {
  return useSWR<T>(
    key,
    fetcher,
    {
      ...defaultSwrConfig,
      refreshInterval: interval,
      ...config,
    }
  )
}
