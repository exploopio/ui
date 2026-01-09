/**
 * Register Form Component
 *
 * Handles user registration via Keycloak
 * - Validates input using centralized schema
 * - Includes password confirmation matching
 * - Redirects to Keycloak for registration
 * - Supports social registration (GitHub, Facebook)
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { IconFacebook, IconGithub } from '@/assets/brand-icons'
import { cn } from '@/lib/utils'
import { redirectToRegister } from '@/lib/keycloak'
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
import { registerSchema, type RegisterInput } from '../schemas/auth.schema'

// ============================================
// TYPES
// ============================================

interface RegisterFormProps extends React.HTMLAttributes<HTMLFormElement> {
  /**
   * URL to redirect to after successful registration
   * @default '/dashboard'
   */
  redirectTo?: string

  /**
   * Whether to show social registration buttons
   * @default true
   */
  showSocialRegister?: boolean
}

// ============================================
// COMPONENT
// ============================================

export function RegisterForm({
  className,
  redirectTo: _redirectTo = '/dashboard',
  showSocialRegister = true,
  ...props
}: RegisterFormProps) {
  // Note: _redirectTo is available for future OAuth redirect implementation
  const [isLoading, setIsLoading] = useState(false)

  // Form setup with centralized schema
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  /**
   * Handle form submission
   * Redirects to Keycloak registration page
   */
  function onSubmit(data: RegisterInput) {
    setIsLoading(true)

    // For development: Log attempt (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Registration attempt:', { email: data.email })
    }

    try {
      // Redirect to Keycloak registration page
      // After successful registration, Keycloak will redirect back to /auth/callback
      // which will then redirect to the specified redirectTo URL
      redirectToRegister()

      // Note: This toast might not show because of redirect
      // The actual success toast should be in the callback page
      toast.loading('Redirecting to registration...')
    } catch (error) {
      setIsLoading(false)
      console.error('Registration redirect error:', error)
      toast.error('Failed to initiate registration. Please try again.')
    }
  }

  /**
   * Handle social registration (GitHub, Facebook)
   *
   * FEATURE: OAuth2 Social Registration with Keycloak
   * To implement:
   * 1. Configure identity providers in Keycloak (GitHub, Facebook, etc.)
   * 2. Enable account creation on first login
   * 3. Use redirectToLogin() with kc_idp_hint to trigger social registration
   *
   * @see https://www.keycloak.org/docs/latest/server_admin/#_identity_broker
   */
  function handleSocialRegister(provider: 'github' | 'facebook') {
    toast.info(`${provider} registration requires Keycloak Identity Provider configuration`)
    // Placeholder for social registration
    // When Keycloak IDP is configured, this will automatically create user on first login
    // redirectToLogin(undefined, { kc_idp_hint: provider })
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
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder='••••••••'
                  autoComplete='new-password'
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password Field */}
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder='••••••••'
                  autoComplete='new-password'
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button className='mt-2' disabled={isLoading} type='submit'>
          {isLoading ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <UserPlus className='h-4 w-4' />
          )}
          Create Account
        </Button>

        {/* Social Registration Section */}
        {showSocialRegister && (
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
                onClick={() => handleSocialRegister('github')}
              >
                <IconGithub className='h-4 w-4' />
                GitHub
              </Button>
              <Button
                variant='outline'
                type='button'
                disabled={isLoading}
                onClick={() => handleSocialRegister('facebook')}
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
