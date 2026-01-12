/**
 * Create Team Form Component
 *
 * Form for creating a new team/tenant
 * - For new users (no tenants): Uses createFirstTeamAction with refresh token
 * - For existing users (has tenants): Uses useCreateTenant with access token
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Link2, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { useTenant } from '@/context/tenant-provider'
import { useCreateTenant } from '../api'
import {
  createTenantSchema,
  generateSlug,
  type CreateTenantInput,
} from '../schemas'
import { createFirstTeamAction } from '@/features/auth/actions/local-auth-actions'

interface CreateTeamFormProps {
  /** Whether to show cancel button (hide when shown in TenantGate) */
  showCancel?: boolean
  /** Whether this is for a new user creating their first team */
  isFirstTeam?: boolean
  /** Suggested team name (from user's name) */
  suggestedName?: string
}

export function CreateTeamForm({ showCancel = true, isFirstTeam = false, suggestedName = '' }: CreateTeamFormProps) {
  const router = useRouter()
  const { refreshTenants, switchTeam } = useTenant()
  const { trigger, isMutating } = useCreateTenant()
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: suggestedName ? `${suggestedName}'s Team` : '',
      slug: suggestedName ? generateSlug(suggestedName) : '',
      description: '',
    },
    mode: 'onChange',
  })

  const watchName = form.watch('name')

  // Auto-generate slug from name if not manually edited
  useEffect(() => {
    if (!isSlugManuallyEdited && watchName) {
      const generatedSlug = generateSlug(watchName)
      form.setValue('slug', generatedSlug, { shouldValidate: true })
    }
  }, [watchName, isSlugManuallyEdited, form])

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true)
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    form.setValue('slug', value, { shouldValidate: true })
  }, [form])

  const onSubmit = async (data: CreateTenantInput) => {
    setIsSubmitting(true)

    try {
      if (isFirstTeam) {
        // Use server action for first team (uses refresh token)
        console.log('[CreateTeamForm] Creating first team via server action')
        const result = await createFirstTeamAction({
          teamName: data.name,
          teamSlug: data.slug,
        })

        if (result.success && result.tenant) {
          toast.success('Team created successfully', {
            description: `Welcome to ${result.tenant.name}!`,
          })

          // Force full page reload to pick up new cookies
          // router.push() doesn't work here because TenantGate state needs to be reset
          window.location.href = '/'
        } else {
          throw new Error(result.error || 'Failed to create team')
        }
      } else {
        // Use mutation hook for additional teams (uses access token)
        console.log('[CreateTeamForm] Creating additional team via API')
        const result = await trigger({
          name: data.name,
          slug: data.slug,
          description: data.description || undefined,
        })

        if (result) {
          toast.success('Team created successfully', {
            description: `Welcome to ${result.name}!`,
          })

          // Refresh tenants list
          await refreshTenants()

          // Switch to the new team
          try {
            await switchTeam(result.id)
            router.push('/')
          } catch {
            // If switch fails, just redirect to dashboard
            router.push('/')
          }
        }
      }
    } catch (error) {
      console.error('Failed to create team:', error)

      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('slug') || error.message.includes('already exists') || error.message.includes('already taken')) {
          form.setError('slug', {
            type: 'manual',
            message: 'This URL is already taken. Please choose another one.',
          })
        } else {
          toast.error('Failed to create team', {
            description: error.message,
          })
        }
      } else {
        toast.error('Failed to create team', {
          description: 'An unexpected error occurred. Please try again.',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const slugValue = form.watch('slug')
  const isFormValid = form.formState.isValid

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Create New Team
        </CardTitle>
        <CardDescription>
          Create a new team to organize your projects and collaborate with others.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Team Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Team Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Corporation"
                      autoFocus
                      disabled={isMutating}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The display name for your team
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* URL Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Team URL
                  </FormLabel>
                  <FormControl>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md">
                        app.rediver.io/
                      </span>
                      <Input
                        placeholder="acme-corp"
                        className="rounded-l-none"
                        disabled={isMutating}
                        {...field}
                        onChange={handleSlugChange}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    URL-friendly identifier (lowercase letters, numbers, hyphens)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview URL */}
            {slugValue && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="text-muted-foreground mb-1">Your team URL will be:</p>
                <p className="font-mono text-primary">
                  https://app.rediver.io/{slugValue}
                </p>
              </div>
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description
                    <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief description of your team..."
                      rows={3}
                      disabled={isMutating}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Help team members understand the purpose of this team
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className={`flex border-t pt-6 ${showCancel ? 'justify-between' : 'justify-end'}`}>
            {showCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isMutating || isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isMutating || isSubmitting || !isFormValid}>
              {(isMutating || isSubmitting) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Create Team
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
