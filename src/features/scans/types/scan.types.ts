/**
 * Scan Types
 *
 * Type definitions for scan management
 */

import type { Status } from '@/features/shared/types'

// ============================================
// SCAN TYPE
// ============================================

export type ScanType = 'full' | 'quick' | 'custom' | 'compliance'

// ============================================
// SCAN MODE (Single vs Workflow)
// ============================================

export type ScanMode = 'single' | 'workflow'

export const SCAN_MODE_CONFIG: Record<
  ScanMode,
  { label: string; description: string; icon: string }
> = {
  single: {
    label: 'Single Scan',
    description: 'Run a one-time scan with custom configuration',
    icon: 'radar',
  },
  workflow: {
    label: 'Workflow Scan',
    description: 'Use a predefined workflow with multiple scan tools',
    icon: 'git-branch',
  },
}

// ============================================
// AGENT PREFERENCE (Platform Agent Selection)
// ============================================

export type AgentPreference = 'auto' | 'tenant' | 'platform'

export const AGENT_PREFERENCE_CONFIG: Record<
  AgentPreference,
  { label: string; description: string; icon: string }
> = {
  auto: {
    label: 'Auto',
    description: 'System selects the best available agent automatically',
    icon: 'sparkles',
  },
  tenant: {
    label: 'Your Agent',
    description: "Use only your organization's deployed agent",
    icon: 'server',
  },
  platform: {
    label: 'Platform Agent',
    description: "Use Rediver's managed cloud agents for faster execution",
    icon: 'cloud',
  },
}

// ============================================
// SCAN WORKFLOW (predefined scan workflows)
// ============================================

export interface ScanWorkflowStep {
  id: string
  name: string
  tool: string
  order: number
  config?: Record<string, unknown>
}

export interface ScanWorkflow {
  id: string
  name: string
  description: string
  steps: ScanWorkflowStep[]
  estimatedDuration: string // e.g., "2-3 hours"
  category: 'recon' | 'vuln' | 'compliance' | 'full'
}

export const mockWorkflows: ScanWorkflow[] = [
  {
    id: 'wf-full-recon',
    name: 'Full Reconnaissance',
    description: 'Complete asset discovery and enumeration workflow',
    estimatedDuration: '3-4 hours',
    category: 'recon',
    steps: [
      { id: 'step-1', name: 'Subdomain Enumeration', tool: 'Subfinder', order: 1 },
      { id: 'step-2', name: 'DNS Resolution', tool: 'DNSx', order: 2 },
      { id: 'step-3', name: 'Port Scanning', tool: 'Nmap', order: 3 },
      { id: 'step-4', name: 'Tech Detection', tool: 'Wappalyzer', order: 4 },
      { id: 'step-5', name: 'Screenshot Capture', tool: 'Gowitness', order: 5 },
    ],
  },
  {
    id: 'wf-vuln-scan',
    name: 'Vulnerability Assessment',
    description: 'Comprehensive vulnerability scanning workflow',
    estimatedDuration: '4-6 hours',
    category: 'vuln',
    steps: [
      { id: 'step-1', name: 'Web Vulnerability Scan', tool: 'Nuclei', order: 1 },
      { id: 'step-2', name: 'SSL/TLS Analysis', tool: 'SSLScan', order: 2 },
      { id: 'step-3', name: 'API Security Test', tool: 'Arjun', order: 3 },
      { id: 'step-4', name: 'XSS Detection', tool: 'Dalfox', order: 4 },
      { id: 'step-5', name: 'SQL Injection Test', tool: 'SQLMap', order: 5 },
    ],
  },
  {
    id: 'wf-quick-check',
    name: 'Quick Security Check',
    description: 'Fast security assessment for critical issues',
    estimatedDuration: '30-60 min',
    category: 'vuln',
    steps: [
      { id: 'step-1', name: 'Port Scan (Top 100)', tool: 'Nmap', order: 1 },
      { id: 'step-2', name: 'Critical CVE Check', tool: 'Nuclei', order: 2 },
      { id: 'step-3', name: 'SSL Certificate Check', tool: 'SSLScan', order: 3 },
    ],
  },
  {
    id: 'wf-compliance',
    name: 'Compliance Audit',
    description: 'PCI DSS and ISO 27001 compliance checks',
    estimatedDuration: '2-3 hours',
    category: 'compliance',
    steps: [
      { id: 'step-1', name: 'TLS Compliance', tool: 'TestSSL', order: 1 },
      { id: 'step-2', name: 'Header Security', tool: 'Nuclei', order: 2 },
      { id: 'step-3', name: 'Cookie Security', tool: 'Cookie Scanner', order: 3 },
      { id: 'step-4', name: 'CORS Check', tool: 'CORScanner', order: 4 },
    ],
  },
  {
    id: 'wf-full-pentest',
    name: 'Full Penetration Test',
    description: 'Complete security assessment workflow',
    estimatedDuration: '8-12 hours',
    category: 'full',
    steps: [
      { id: 'step-1', name: 'Subdomain Discovery', tool: 'Amass', order: 1 },
      { id: 'step-2', name: 'DNS Enumeration', tool: 'DNSx', order: 2 },
      { id: 'step-3', name: 'Full Port Scan', tool: 'Nmap', order: 3 },
      { id: 'step-4', name: 'Service Detection', tool: 'Nmap', order: 4 },
      { id: 'step-5', name: 'Vulnerability Scan', tool: 'Nuclei', order: 5 },
      { id: 'step-6', name: 'Web Application Test', tool: 'Nikto', order: 6 },
      { id: 'step-7', name: 'API Security Test', tool: 'Arjun', order: 7 },
      { id: 'step-8', name: 'Authentication Test', tool: 'Hydra', order: 8 },
    ],
  },
]

export const SCAN_TYPE_CONFIG: Record<ScanType, { label: string; description: string }> = {
  full: {
    label: 'Full Scan',
    description: 'Complete vulnerability assessment',
  },
  quick: {
    label: 'Quick Scan',
    description: 'Fast check for critical issues',
  },
  custom: {
    label: 'Custom',
    description: 'Select specific checks',
  },
  compliance: {
    label: 'Compliance',
    description: 'PCI DSS / ISO 27001 / SOC2',
  },
}

export const SCAN_TYPE_LABELS: Record<ScanType, string> = {
  full: 'Full Scan',
  quick: 'Quick Scan',
  custom: 'Custom',
  compliance: 'Compliance',
}

// ============================================
// SCAN OPTIONS
// ============================================

export interface ScanOptions {
  portScanning: boolean
  webAppScanning: boolean
  sslAnalysis: boolean
  bruteForce: boolean
  techDetection: boolean
  apiSecurity: boolean
}

export const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  portScanning: true,
  webAppScanning: true,
  sslAnalysis: true,
  bruteForce: false,
  techDetection: true,
  apiSecurity: false,
}

export const SCAN_OPTIONS_CONFIG: Record<
  keyof ScanOptions,
  { label: string; description: string }
> = {
  portScanning: {
    label: 'Port Scanning',
    description: 'Scan for open ports and services',
  },
  webAppScanning: {
    label: 'Web Application Scanning',
    description: 'Test for web vulnerabilities (XSS, SQLi, etc.)',
  },
  sslAnalysis: {
    label: 'SSL/TLS Analysis',
    description: 'Check certificate and encryption configuration',
  },
  bruteForce: {
    label: 'Brute Force Testing',
    description: 'Test authentication strength (use with caution)',
  },
  techDetection: {
    label: 'Technology Detection',
    description: 'Identify frameworks, libraries, and versions',
  },
  apiSecurity: {
    label: 'API Security Testing',
    description: 'Test API endpoints for vulnerabilities',
  },
}

// ============================================
// INTENSITY
// ============================================

export type ScanIntensity = 'low' | 'medium' | 'high'

export const SCAN_INTENSITY_CONFIG: Record<ScanIntensity, { label: string; value: number }> = {
  low: { label: 'Low', value: 0 },
  medium: { label: 'Medium', value: 50 },
  high: { label: 'High', value: 100 },
}

// ============================================
// SCHEDULE
// ============================================

export type ScheduleFrequency = 'once' | 'daily' | 'weekly' | 'monthly'

export interface ScanSchedule {
  runImmediately: boolean
  frequency?: ScheduleFrequency
  dayOfWeek?: number // 0 = Sunday, 1 = Monday, etc.
  time?: string // "02:00" format
}

export const FREQUENCY_OPTIONS: { value: ScheduleFrequency; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export const DAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: `${i.toString().padStart(2, '0')}:00`,
  label: `${i.toString().padStart(2, '0')}:00`,
}))

// ============================================
// NOTIFICATIONS
// ============================================

export interface ScanNotifications {
  notifyOnComplete: boolean
  autoCreateTasks: boolean
}

export const DEFAULT_NOTIFICATIONS: ScanNotifications = {
  notifyOnComplete: true,
  autoCreateTasks: true,
}

// ============================================
// TARGET SELECTION
// ============================================

export type TargetType = 'asset_groups' | 'individual' | 'custom'

export interface ScanTargets {
  type: TargetType
  assetGroupIds: string[]
  assetIds: string[]
  customTargets: string[] // domains, IPs
}

export const DEFAULT_TARGETS: ScanTargets = {
  type: 'asset_groups',
  assetGroupIds: [],
  assetIds: [],
  customTargets: [],
}

// ============================================
// NEW SCAN FORM DATA
// ============================================

export interface NewScanFormData {
  // Step 1: Basic Info
  name: string
  mode: ScanMode
  type: ScanType
  workflowId?: string // Only used when mode is "workflow"
  agentPreference: AgentPreference // Platform agent selection

  // Step 2: Targets
  targets: ScanTargets

  // Step 3: Options (only for single mode)
  options: ScanOptions
  intensity: ScanIntensity
  maxConcurrent: number

  // Step 4: Schedule
  schedule: ScanSchedule
  notifications: ScanNotifications
}

export const DEFAULT_NEW_SCAN: NewScanFormData = {
  name: '',
  mode: 'single',
  type: 'quick',
  workflowId: undefined,
  agentPreference: 'auto',
  targets: DEFAULT_TARGETS,
  options: DEFAULT_SCAN_OPTIONS,
  intensity: 'medium',
  maxConcurrent: 10,
  schedule: {
    runImmediately: true,
    frequency: 'weekly',
    dayOfWeek: 1,
    time: '02:00',
  },
  notifications: DEFAULT_NOTIFICATIONS,
}

// ============================================
// AGENT TYPE (tenant vs platform)
// ============================================

export type AgentType = 'tenant' | 'platform'

export const AGENT_TYPE_CONFIG: Record<
  AgentType,
  { label: string; description: string; color: string }
> = {
  tenant: {
    label: 'Your Agent',
    description: "Running on your organization's deployed agent",
    color: 'blue',
  },
  platform: {
    label: 'Platform Agent',
    description: "Running on Rediver's managed cloud infrastructure",
    color: 'purple',
  },
}

// ============================================
// SCAN ENTITY (for listing)
// ============================================

export interface Scan {
  id: string
  name: string
  description?: string
  type: ScanType
  status: Status
  targets: ScanTargets
  targetCount: number
  progress: number // 0-100
  options: ScanOptions
  intensity: ScanIntensity
  maxConcurrent: number
  findingsCount: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  startedAt?: string
  completedAt?: string
  duration?: number // in seconds
  schedule: ScanSchedule
  notifications: ScanNotifications
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string

  // Platform agent fields
  agentPreference: AgentPreference
  agentType?: AgentType // Actual agent type assigned
  agentId?: string // Agent ID if assigned
  agentName?: string // Agent name for display
  queuePosition?: number // Position in queue (for platform jobs)
}

// ============================================
// SCAN STATISTICS
// ============================================

export interface ScanStats {
  totalScans: number
  activeScans: number
  completedScans: number
  failedScans: number
  scheduledScans: number
  totalFindings: number
  averageDuration: number
}
