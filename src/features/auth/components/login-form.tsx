/**
 * Login Form Component
 *
 * Handles user authentication via Keycloak
 * - Validates input using centralized schema
 * - Redirects to Keycloak for OAuth2 authentication
 * - Supports social login (GitHub, Facebook)
 */

'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'

import { useRouter } from 'next/navigation'
import { IconFacebook, IconGithub } from '@/assets/brand-icons'
import { cn } from '@/lib/utils'
import { redirectToLogin } from '@/lib/keycloak'
import {
  isDevAuthEnabled,
  validateDevCredentials,
  generateDevToken,
  setDevAuthCookie,
  DEV_CREDENTIALS,
} from '@/lib/dev-auth'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

// Import centralized schema
import { loginSchema, type LoginInput } from '../schemas/auth.schema'

// ============================================
// TYPES
// ============================================

interface LoginFormProps extends React.HTMLAttributes<HTMLFormElement> {
  /**
   * URL to redirect to after successful login
   * @default '/'
   */
  redirectTo?: string

  /**
   * Whether to show social login buttons
   * @default true
   */
  showSocialLogin?: boolean
}

// ============================================
// COMPONENT
// ============================================

export function LoginForm({
  className,
  redirectTo = '/',
  showSocialLogin = true,
  ...props
}: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const login = useAuthStore((state) => state.login)

  // Check dev mode using useSyncExternalStore to avoid hydration mismatch
  // and prevent cascading renders from setState in useEffect
  const isDevMode = useSyncExternalStore(
    () => () => {}, // subscribe (no-op - value doesn't change)
    isDevAuthEnabled, // getSnapshot (client)
    () => false // getServerSnapshot (SSR)
  )

  // Form setup with centralized schema
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Pre-fill dev credentials after mount
  useEffect(() => {
    if (isDevMode) {
      form.setValue('email', DEV_CREDENTIALS.email)
      form.setValue('password', DEV_CREDENTIALS.password)
    }
  }, [isDevMode, form])

  /**
   * Handle form submission
   * In dev mode: validates against dev credentials
   * In production: Redirects to Keycloak for OAuth2 authentication
   */
  function onSubmit(data: LoginInput) {
    setIsLoading(true)

    // Development mode: Use dev auth bypass
    if (isDevMode) {
      console.log('Dev login attempt:', { email: data.email })

      if (validateDevCredentials(data.email, data.password)) {
        const token = generateDevToken()
        login(token)
        setDevAuthCookie() // Set cookie for middleware to recognize
        toast.success('Logged in successfully (Dev Mode)')
        router.push(redirectTo)
      } else {
        setIsLoading(false)
        toast.error('Invalid credentials. Use admin@rediver.io / admin123')
      }
      return
    }

    // Production mode: Redirect to Keycloak
    try {
      redirectToLogin(redirectTo)
      toast.loading('Redirecting to login...')
    } catch (error) {
      setIsLoading(false)
      console.error('Login redirect error:', error)
      toast.error('Failed to initiate login. Please try again.')
    }
  }

  /**
   * Handle social login (GitHub, Facebook)
   *
   * FEATURE: OAuth2 Social Login with Keycloak
   * To implement:
   * 1. Configure identity providers in Keycloak (GitHub, Facebook, etc.)
   * 2. Update redirectToLogin() to accept kc_idp_hint parameter
   * 3. Uncomment and use: redirectToLogin(redirectTo, { kc_idp_hint: provider })
   *
   * @see https://www.keycloak.org/docs/latest/server_admin/#_identity_broker
   */
  function handleSocialLogin(provider: 'github' | 'facebook') {
    toast.info(`${provider} login requires Keycloak Identity Provider configuration`)
    // Placeholder for social login
    // When Keycloak IDP is configured, implement like this:
    // redirectToLogin(redirectTo, { kc_idp_hint: provider })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        {/* Email Field */}
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder='name@example.com'
                  type='email'
                  autoComplete='email'
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder='••••••••'
                  autoComplete='current-password'
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />

              {/* Forgot Password Link */}
              <Link
                href='/forgot-password'
                className='text-muted-foreground absolute end-0 -top-0.5 text-sm font-medium hover:opacity-75'
                tabIndex={-1}
              >
                Forgot password?
              </Link>
            </FormItem>
          )}
        />

        {/* Dev Mode Indicator */}
        {isDevMode && (
          <div className='bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-md px-3 py-2 text-xs'>
            <strong>Dev Mode:</strong> Use admin@rediver.io / admin123
          </div>
        )}

        {/* Submit Button */}
        <Button className='mt-2' disabled={isLoading} type='submit'>
          {isLoading ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <LogIn className='h-4 w-4' />
          )}
          Sign in
        </Button>

        {/* Social Login Section */}
        {showSocialLogin && (
          <>
            <div className='relative my-2'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background text-muted-foreground px-2'>
                  Or continue with
                </span>
              </div>
            </div>

            <div className='grid grid-cols-1 gap-2 xs:grid-cols-2'>
              <Button
                variant='outline'
                type='button'
                disabled={isLoading}
                onClick={() => handleSocialLogin('github')}
              >
                <IconGithub className='h-4 w-4' />
                GitHub
              </Button>
              <Button
                variant='outline'
                type='button'
                disabled={isLoading}
                onClick={() => handleSocialLogin('facebook')}
              >
                <IconFacebook className='h-4 w-4' />
                Facebook
              </Button>
            </div>
          </>
        )}
      </form>
    </Form>
  )
}
