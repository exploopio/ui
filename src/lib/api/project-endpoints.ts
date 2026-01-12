/**
 * Project API Endpoints
 *
 * Endpoint definitions for project management
 * Projects are tenant-scoped resources
 */

import { buildQueryString } from './client'
import type { ProjectFilters } from './project-types'

// ============================================
// PROJECT ENDPOINTS
// ============================================

/**
 * Build project endpoints for a tenant
 */
export const projectEndpoints = {
  /**
   * List projects with filters
   */
  list: (tenantId: string, filters?: ProjectFilters) => {
    const queryParams: Record<string, unknown> = {}

    if (filters) {
      if (filters.name) queryParams.name = filters.name
      if (filters.providers?.length) queryParams.providers = filters.providers.join(',')
      if (filters.visibilities?.length) queryParams.visibilities = filters.visibilities.join(',')
      if (filters.statuses?.length) queryParams.statuses = filters.statuses.join(',')
      if (filters.languages?.length) queryParams.languages = filters.languages.join(',')
      if (filters.tags?.length) queryParams.tags = filters.tags.join(',')
      if (filters.has_findings !== undefined) queryParams.has_findings = filters.has_findings
      if (filters.page) queryParams.page = filters.page
      if (filters.per_page) queryParams.per_page = filters.per_page
    }

    const queryString = Object.keys(queryParams).length > 0
      ? buildQueryString(queryParams)
      : ''

    return `/api/v1/tenants/${tenantId}/projects${queryString}`
  },

  /**
   * Get single project by ID
   */
  get: (tenantId: string, projectId: string) =>
    `/api/v1/tenants/${tenantId}/projects/${projectId}`,

  /**
   * Create new project
   */
  create: (tenantId: string) =>
    `/api/v1/tenants/${tenantId}/projects`,

  /**
   * Update project by ID
   */
  update: (tenantId: string, projectId: string) =>
    `/api/v1/tenants/${tenantId}/projects/${projectId}`,

  /**
   * Delete project by ID
   */
  delete: (tenantId: string, projectId: string) =>
    `/api/v1/tenants/${tenantId}/projects/${projectId}`,

  /**
   * Get project components
   */
  components: (tenantId: string, projectId: string) =>
    `/api/v1/tenants/${tenantId}/projects/${projectId}/components`,

  /**
   * Get project findings
   */
  findings: (tenantId: string, projectId: string) =>
    `/api/v1/tenants/${tenantId}/projects/${projectId}/findings`,

  /**
   * Import SARIF results
   */
  importSarif: (tenantId: string, projectId: string) =>
    `/api/v1/tenants/${tenantId}/projects/${projectId}/import/sarif`,
} as const
