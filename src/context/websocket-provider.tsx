'use client'

/**
 * WebSocket Provider
 *
 * Provides global WebSocket connection for real-time updates.
 * Should be wrapped inside TenantProvider to get authentication token.
 *
 * Authentication:
 * - Same-origin (production): Uses httpOnly cookie automatically sent by browser
 * - Cross-origin (development): Falls back to fetching token from /api/auth/sse-token
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import {
  WebSocketClient,
  initWebSocketClient,
  destroyWebSocketClient,
  type ConnectionState,
} from '@/lib/websocket'
import { useTenant } from '@/context/tenant-provider'
import { env } from '@/lib/env'

// ============================================
// CONTEXT
// ============================================

interface WebSocketContextValue {
  /** Current connection state */
  state: ConnectionState
  /** Whether WebSocket is connected */
  isConnected: boolean
  /** Reconnect manually */
  reconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

// ============================================
// HELPERS
// ============================================

/**
 * Check if WebSocket URL is same-origin as current page.
 * Same-origin means browser will send cookies automatically.
 */
function isSameOrigin(wsUrl: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const wsOrigin = new URL(wsUrl.replace(/^ws/, 'http')).origin
    return wsOrigin === window.location.origin
  } catch {
    return false
  }
}

// ============================================
// PROVIDER
// ============================================

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { currentTenant } = useTenant()
  const [state, setState] = useState<ConnectionState>('disconnected')
  const [token, setToken] = useState<string | null>(null)
  const clientRef = useRef<WebSocketClient | null>(null)
  const tokenFetchedRef = useRef(false)

  // Build WebSocket URL
  // Note: NEXT_PUBLIC_* env vars must be accessed directly for client-side bundling
  const wsUrl =
    typeof window !== 'undefined'
      ? (() => {
          // Try direct env access first, then fallback to env.ts, then window.location
          const apiBaseUrl =
            process.env.NEXT_PUBLIC_WS_BASE_URL ||
            process.env.NEXT_PUBLIC_SSE_BASE_URL ||
            env.api.wsBaseUrl ||
            window.location.origin
          console.log('[WebSocket] Base URL:', apiBaseUrl, 'env.wsBaseUrl:', env.api.wsBaseUrl)
          const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws'
          const wsHost = apiBaseUrl.replace(/^https?:\/\//, '')
          return `${wsProtocol}://${wsHost}/api/v1/ws`
        })()
      : ''

  // Check if we need to fetch token (cross-origin only)
  const needsToken = wsUrl && !isSameOrigin(wsUrl)

  // Fetch token for cross-origin WebSocket (cookies won't be sent automatically)
  useEffect(() => {
    if (!needsToken || !currentTenant || tokenFetchedRef.current) return

    const fetchToken = async () => {
      try {
        console.log('[WebSocket] Cross-origin detected, fetching token...')
        const response = await fetch('/api/auth/sse-token')
        if (response.ok) {
          const data = await response.json()
          setToken(data.token)
          tokenFetchedRef.current = true
        }
      } catch (error) {
        console.error('[WebSocket] Failed to fetch token:', error)
      }
    }

    fetchToken()
  }, [needsToken, currentTenant])

  // Initialize WebSocket client
  useEffect(() => {
    // For cross-origin: wait for token
    // For same-origin: connect immediately (cookie will be sent)
    if (!wsUrl || !currentTenant) return
    if (needsToken && !token) return

    console.log(
      '[WebSocket] Initializing client...',
      needsToken ? '(with token)' : '(cookie-based)'
    )

    clientRef.current = initWebSocketClient({
      url: wsUrl,
      token: needsToken ? (token ?? undefined) : undefined,
      onStateChange: (newState) => {
        console.log('[WebSocket] State changed:', newState)
        setState(newState)
      },
      onError: (error) => {
        console.error('[WebSocket] Error:', error)
      },
    })

    clientRef.current.connect()

    return () => {
      console.log('[WebSocket] Cleaning up...')
      destroyWebSocketClient()
      tokenFetchedRef.current = false
    }
  }, [wsUrl, token, currentTenant, needsToken])

  const reconnect = useCallback(() => {
    clientRef.current?.connect()
  }, [])

  const value: WebSocketContextValue = {
    state,
    isConnected: state === 'connected',
    reconnect,
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

// ============================================
// HOOK
// ============================================

/**
 * Hook to access WebSocket context
 */
export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    // Return a default value when outside provider (for SSR or non-dashboard pages)
    return {
      state: 'disconnected' as ConnectionState,
      isConnected: false,
      reconnect: () => {},
    }
  }
  return context
}
