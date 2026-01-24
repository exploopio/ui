/**
 * Licensing Feature
 *
 * Module-based feature gating and subscription management.
 *
 * @example
 * ```tsx
 * // Gate content by module
 * import { ModuleGate, UpgradePrompt } from '@/features/licensing';
 *
 * <ModuleGate module="findings">
 *   <FindingsPage />
 * </ModuleGate>
 *
 * // Check subscription
 * import { useTenantSubscription, usePlans } from '@/features/licensing';
 *
 * const { plan, isActive } = useTenantSubscription();
 * const { plans } = usePlans();
 *
 * // Show usage limits
 * import { LimitIndicator, useModuleLimit } from '@/features/licensing';
 *
 * const { limit } = useModuleLimit('assets', 'max_items');
 * <LimitIndicator current={assets.length} limit={limit} label="Assets" />
 * ```
 */

// Components
export {
  ModuleGate,
  useModuleAccess,
  UpgradePrompt,
  LimitIndicator,
  type ModuleGateProps,
  type UpgradePromptProps,
  type LimitIndicatorProps,
} from './components'

// API Hooks
export {
  useTenantSubscription,
  usePlans,
  usePlan,
  useModuleLimit,
  useTenantModules,
  useHasModule,
  type Plan,
  type PlanModule,
  type TenantSubscription,
  type LicensingModule,
  type TenantModulesResponse,
} from './api'
