/**
 * Licensing API Hooks
 *
 * Re-exports all licensing-related API hooks.
 */

// Subscription & Plans
export {
  useTenantSubscription,
  usePlans,
  usePlan,
  useModuleLimit,
  type Plan,
  type PlanModule,
  type TenantSubscription,
} from './use-subscription'

// Tenant Modules (re-export from integrations)
export {
  useTenantModules,
  useHasModule,
  type LicensingModule,
  type TenantModulesResponse,
} from '@/features/integrations/api/use-tenant-modules'
