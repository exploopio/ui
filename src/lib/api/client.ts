/**
 * API Client
 *
 * HTTP client for making authenticated requests to backend API
 * Automatically injects auth headers and handles errors
 */

import { useAuthStore } from '@/stores/auth-store'
import type { ApiError, ApiRequestOptions, ApiResponse } from './types'
import { ApiClientError } from './error-handler'

// ============================================
// CONFIGURATION
// ============================================

/**
 * Get backend API base URL from environment
 */
export function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

  if (!baseUrl) {
    throw new Error(
      'NEXT_PUBLIC_BACKEND_API_URL is not defined. Please set it in .env.local'
    )
  }

  return baseUrl
}

/**
 * Default request timeout (30 seconds)
 */
const DEFAULT_TIMEOUT = 30000

// ============================================
// CORE API CLIENT
// ============================================

/**
 * Main API client function
 *
 * Makes HTTP requests to backend API with automatic:
 * - Auth header injection (Bearer token)
 * - Error handling
 * - Timeout management
 * - JSON serialization/deserialization
 *
 * @example
 * ```typescript
 * // GET request
 * const users = await apiClient<User[]>('/api/users')
 *
 * // POST request
 * const newUser = await apiClient<User>('/api/users', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' })
 * })
 * ```
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    skipAuth = false,
    baseUrl = getApiBaseUrl(),
    timeout = DEFAULT_TIMEOUT,
    retry: _retry, // Reserved for future retry implementation
    ...fetchOptions
  } = options

  // Build full URL
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`

  // Get access token from auth store
  const accessToken = skipAuth ? null : useAuthStore.getState().accessToken

  // Build headers
  const headers = new Headers(fetchOptions.headers)

  // Add Content-Type if not present and body exists
  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Add Authorization header if token exists
  if (accessToken && !skipAuth) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    // Make request
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Handle non-ok responses
    if (!response.ok) {
      const error = await parseErrorResponse(response)
      throw new ApiClientError(error.message, error.code, error.statusCode, error.details)
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T
    }

    // Parse JSON response
    const data = await response.json()

    // If response is wrapped in ApiResponse, unwrap it
    if (isApiResponse(data)) {
      if (!data.success) {
        throw new ApiClientError(
          data.error?.message || 'API request failed',
          data.error?.code || 'UNKNOWN_ERROR',
          response.status,
          data.error?.details
        )
      }
      return data.data as T
    }

    return data as T
  } catch (error) {
    clearTimeout(timeoutId)

    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError(
        'Request timeout',
        'TIMEOUT',
        408,
        { timeout, url }
      )
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new ApiClientError(
        'Network error - please check your connection',
        'NETWORK_ERROR',
        0,
        { originalError: error.message }
      )
    }

    // Re-throw ApiClientError
    if (error instanceof ApiClientError) {
      throw error
    }

    // Handle unknown errors
    throw new ApiClientError(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500,
      { originalError: error }
    )
  }
}

/**
 * Parse error response from backend
 */
async function parseErrorResponse(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type')

  // Try to parse JSON error response
  if (contentType?.includes('application/json')) {
    try {
      const data = await response.json()

      // Backend returned ApiResponse format
      if (data.error) {
        return {
          code: data.error.code || 'UNKNOWN_ERROR',
          message: data.error.message || response.statusText,
          details: data.error.details,
          statusCode: response.status,
        }
      }

      // Backend returned plain error object
      if (data.message) {
        return {
          code: data.code || 'UNKNOWN_ERROR',
          message: data.message,
          details: data.details,
          statusCode: response.status,
        }
      }

      // Unknown JSON format
      return {
        code: 'UNKNOWN_ERROR',
        message: response.statusText || 'Unknown error',
        details: data,
        statusCode: response.status,
      }
    } catch {
      // JSON parsing failed
    }
  }

  // Fallback to status text
  return {
    code: `HTTP_${response.status}`,
    message: response.statusText || 'HTTP error',
    statusCode: response.status,
  }
}

/**
 * Check if response is ApiResponse format
 */
function isApiResponse<T>(data: unknown): data is ApiResponse<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    typeof (data as ApiResponse).success === 'boolean'
  )
}

// ============================================
// CONVENIENCE METHODS
// ============================================

/**
 * GET request
 */
export async function get<T = unknown>(
  endpoint: string,
  options?: ApiRequestOptions
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'GET',
  })
}

/**
 * POST request
 */
export async function post<T = unknown>(
  endpoint: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT request
 */
export async function put<T = unknown>(
  endpoint: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PATCH request
 */
export async function patch<T = unknown>(
  endpoint: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE request
 */
export async function del<T = unknown>(
  endpoint: string,
  options?: ApiRequestOptions
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'DELETE',
  })
}

// ============================================
// FILE UPLOAD
// ============================================

/**
 * Upload file to backend
 *
 * @example
 * ```typescript
 * const file = document.getElementById('file').files[0]
 * const response = await uploadFile('/api/files', file, {
 *   onProgress: (progress) => console.log(`${progress.percentage}%`)
 * })
 * ```
 */
export async function uploadFile<T = unknown>(
  endpoint: string,
  file: File,
  options?: ApiRequestOptions & {
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  }
): Promise<T> {
  const { onProgress, ...requestOptions } = options || {}
  // Note: requestOptions reserved for future XHR config options
  void requestOptions

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)

    // Get auth token
    const accessToken = useAuthStore.getState().accessToken
    const baseUrl = getApiBaseUrl()
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`

    // Setup request
    xhr.open('POST', url)

    // Add auth header
    if (accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    }

    // Progress handler
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          })
        }
      })
    }

    // Success handler
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve(data as T)
        } catch {
          resolve(xhr.responseText as T)
        }
      } else {
        reject(new ApiClientError(
          'File upload failed',
          'UPLOAD_FAILED',
          xhr.status,
          { statusText: xhr.statusText }
        ))
      }
    })

    // Error handler
    xhr.addEventListener('error', () => {
      reject(new ApiClientError(
        'Network error during upload',
        'NETWORK_ERROR',
        0
      ))
    })

    // Send request
    xhr.send(formData)
  })
}

// ============================================
// UTILITIES
// ============================================

/**
 * Build query string from object
 *
 * @example
 * ```typescript
 * buildQueryString({ page: 1, search: 'test' })
 * // Returns: "?page=1&search=test"
 * ```
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * Check if user is authenticated (has access token)
 */
export function isAuthenticated(): boolean {
  return !!useAuthStore.getState().accessToken
}
