'use client'

import { useState } from 'react'
import { Main } from '@/components/layout'
import { PageHeader } from '@/features/shared'
import { Button } from '@/components/ui/button'
import {
  CreditCard,
  Check,
  Zap,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Loader2,
  Users,
  Server,
  Headphones,
  Gift,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTenantSubscription, usePlans, LimitIndicator } from '@/features/licensing'

// Status badge colors
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500',
  trial: 'bg-blue-500',
  past_due: 'bg-yellow-500',
  cancelled: 'bg-orange-500',
  expired: 'bg-red-500',
}

export default function BillingPage() {
  const {
    subscription,
    plan: currentPlan,
    isActive,
    isLoading: subLoading,
  } = useTenantSubscription()
  const { plans, isLoading: plansLoading } = usePlans()
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null)

  const handleUpdatePayment = () => {
    toast.info('Redirecting to payment portal...')
    // TODO: Implement Stripe customer portal
  }

  const handleChangePlan = async (planSlug: string) => {
    setUpgradingPlan(planSlug)
    // TODO: Implement plan change via Stripe
    setTimeout(() => {
      setUpgradingPlan(null)
      toast.info(`Contact sales to upgrade to ${planSlug} plan`)
    }, 1000)
  }

  const isCurrentPlan = (planSlug: string) => {
    return currentPlan?.slug === planSlug
  }

  // Format price display
  const formatPrice = (price: number | null, currency: string = 'USD') => {
    if (price === null) return 'Custom'
    if (price === 0) return 'Free'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <>
      <Main>
        <PageHeader title="Billing" description="Manage your subscription and billing information">
          <Button variant="outline" onClick={handleUpdatePayment}>
            <CreditCard className="mr-2 h-4 w-4" />
            Update Payment Method
          </Button>
        </PageHeader>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Current Plan */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    {subLoading ? (
                      <Skeleton className="h-6 w-32" />
                    ) : (
                      <>{currentPlan?.name || 'No Plan'} Plan</>
                    )}
                  </CardTitle>
                  <CardDescription>Your current subscription</CardDescription>
                </div>
                {subLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <Badge className={cn(STATUS_COLORS[subscription?.status || 'expired'])}>
                    {subscription?.status || 'Unknown'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {subLoading ? (
                <>
                  <Skeleton className="h-10 w-40" />
                  <Separator />
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {formatPrice(currentPlan?.price_monthly || 0, currentPlan?.currency)}
                    </span>
                    <span className="text-muted-foreground">
                      /{subscription?.billing_cycle || 'month'}
                    </span>
                  </div>

                  <Separator />

                  {/* Features List */}
                  {currentPlan?.features && currentPlan.features.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Plan Features</h4>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {currentPlan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Separator />

                  {/* Plan Limits */}
                  {currentPlan && (
                    <div className="grid grid-cols-3 gap-4 rounded-lg border p-4 bg-muted/30">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                          <Users className="h-4 w-4" />
                          <span className="text-xs">Team Members</span>
                        </div>
                        <span className="text-lg font-semibold">
                          {currentPlan.max_users === -1 ? 'Unlimited' : currentPlan.max_users}
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                          <Server className="h-4 w-4" />
                          <span className="text-xs">Assets</span>
                        </div>
                        <span className="text-lg font-semibold">
                          {currentPlan.max_assets === -1 ? 'Unlimited' : currentPlan.max_assets}
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                          <Headphones className="h-4 w-4" />
                          <span className="text-xs">Support</span>
                        </div>
                        <span className="text-lg font-semibold capitalize">
                          {currentPlan.support_level || 'Community'}
                        </span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Subscription Dates */}
                  <div className="space-y-2 text-sm">
                    {subscription?.started_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Started</span>
                        <span className="font-medium">
                          {new Date(subscription.started_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                    {subscription?.expires_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Expires</span>
                        <span className="font-medium">
                          {new Date(subscription.expires_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={handleUpdatePayment}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Stats / Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Usage Limits
              </CardTitle>
              <CardDescription>Your current plan limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : currentPlan?.modules && currentPlan.modules.length > 0 ? (
                currentPlan.modules
                  .filter((pm) => Object.keys(pm.limits).length > 0)
                  .slice(0, 3)
                  .map((pm) => (
                    <div key={pm.module_id} className="space-y-2">
                      {Object.entries(pm.limits).map(([metric, limit]) => (
                        <LimitIndicator
                          key={`${pm.module_id}-${metric}`}
                          current={0} // TODO: Get actual usage from API
                          limit={limit}
                          label={formatMetricLabel(pm.module_id, metric)}
                          variant="compact"
                        />
                      ))}
                    </div>
                  ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Unlimited on your plan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Available Plans */}
        <Card className="mt-6" id="compare">
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Choose the plan that best fits your needs</CardDescription>
          </CardHeader>
          <CardContent>
            {plansLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-80 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {plans.map((plan) => {
                  const isCurrent = isCurrentPlan(plan.slug)
                  const isPopular = plan.is_popular
                  const isUpgrading = upgradingPlan === plan.slug

                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        'relative rounded-lg border p-4 sm:p-6 transition-all',
                        isPopular && 'border-primary ring-2 ring-primary',
                        isCurrent && 'bg-muted/50'
                      )}
                    >
                      {plan.badge && (
                        <Badge
                          className={cn(
                            'absolute -top-2 right-4',
                            plan.badge === 'POPULAR' && 'bg-primary',
                            plan.badge === 'BEST VALUE' && 'bg-green-500'
                          )}
                        >
                          {plan.badge}
                        </Badge>
                      )}
                      {isCurrent && !plan.badge && (
                        <Badge className="absolute -top-2 right-4" variant="outline">
                          Current Plan
                        </Badge>
                      )}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">{plan.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {plan.description}
                          </p>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">
                            {formatPrice(plan.price_monthly, plan.currency)}
                          </span>
                          {plan.price_monthly !== null && plan.price_monthly > 0 && (
                            <span className="text-muted-foreground">/month</span>
                          )}
                        </div>
                        {/* Plan limits summary */}
                        <div className="grid grid-cols-2 gap-2 text-xs border rounded-md p-2 bg-muted/30">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {plan.max_users === -1 ? 'Unlimited' : plan.max_users} users
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Server className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {plan.max_assets === -1 ? 'Unlimited' : plan.max_assets} assets
                            </span>
                          </div>
                          {plan.trial_days > 0 && (
                            <div className="flex items-center gap-1 col-span-2">
                              <Gift className="h-3 w-3 text-blue-500" />
                              <span className="text-blue-600">
                                {plan.trial_days}-day free trial
                              </span>
                            </div>
                          )}
                        </div>
                        <ul className="space-y-2 min-h-[100px]">
                          {plan.features.slice(0, 4).map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {plan.features.length > 4 && (
                            <li className="text-sm text-muted-foreground">
                              +{plan.features.length - 4} more features
                            </li>
                          )}
                        </ul>
                        <Button
                          className="w-full"
                          variant={isCurrent ? 'outline' : isPopular ? 'default' : 'secondary'}
                          disabled={isCurrent || isUpgrading}
                          onClick={() => handleChangePlan(plan.slug)}
                        >
                          {isUpgrading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : isCurrent ? (
                            'Current Plan'
                          ) : plan.price_monthly === null ? (
                            'Contact Sales'
                          ) : (
                            'Upgrade'
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Inactive Warning */}
        {!subLoading && !isActive && subscription && (
          <Card className="mt-6 border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Subscription {subscription.status === 'expired' ? 'Expired' : 'Inactive'}
              </CardTitle>
              <CardDescription>
                {subscription.status === 'cancelled'
                  ? 'Your subscription has been cancelled. You can still access your data until the end of the billing period.'
                  : subscription.status === 'past_due'
                    ? 'Your payment is past due. Please update your payment method to continue using the service.'
                    : 'Your subscription has expired. Please renew to continue using the service.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleUpdatePayment}>
                <CreditCard className="mr-2 h-4 w-4" />
                {subscription.status === 'past_due' ? 'Update Payment' : 'Renew Subscription'}
              </Button>
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  )
}

// Helper to format metric labels
function formatMetricLabel(moduleId: string, metric: string): string {
  const labels: Record<string, Record<string, string>> = {
    assets: { max_items: 'Assets' },
    team: { max_members: 'Team Members' },
    scans: { max_per_month: 'Scans/Month' },
  }
  return labels[moduleId]?.[metric] || `${moduleId} ${metric}`
}
