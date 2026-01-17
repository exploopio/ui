/**
 * Integration Types
 *
 * Types for managing external integrations and connections.
 * Integrations are pull-based data sources that the platform connects to.
 */

/**
 * Integration category
 */
export type IntegrationCategory =
  | 'scm'           // Source Code Management: GitHub, GitLab, Bitbucket
  | 'security'      // Security Tools: Wiz, Snyk, Tenable
  | 'ticketing'     // Issue Trackers: Jira, Linear
  | 'cloud'         // Cloud Providers: AWS, GCP, Azure
  | 'notification'; // Notifications: Slack, Teams, Email

/**
 * Integration provider
 */
export type IntegrationProvider =
  // SCM
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'azure_devops'
  // Security
  | 'wiz'
  | 'snyk'
  | 'tenable'
  | 'crowdstrike'
  // Ticketing
  | 'jira'
  | 'linear'
  | 'asana'
  // Cloud
  | 'aws'
  | 'gcp'
  | 'azure'
  // Notification
  | 'slack'
  | 'teams'
  | 'email'
  | 'webhook';

/**
 * Integration status
 */
export type IntegrationStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'pending'
  | 'expired';

/**
 * Authentication type
 */
export type AuthType =
  | 'oauth'
  | 'token'
  | 'api_key'
  | 'basic'
  | 'app';

/**
 * Integration entity
 */
export interface Integration {
  id: string;
  tenant_id: string;
  name: string;
  provider: IntegrationProvider;
  category: IntegrationCategory;
  status: IntegrationStatus;
  status_message?: string;

  // Connection details
  auth_type: AuthType;
  base_url?: string;
  credentials_masked?: string; // e.g., "ghp_xxxx...xxxx"

  // Sync info
  last_sync_at?: string;
  next_sync_at?: string;
  sync_interval_minutes?: number;

  // Statistics
  stats: {
    total_assets: number;
    total_findings: number;
    total_repositories?: number;
  };

  // Metadata
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;

  // Timestamps
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

/**
 * Integration list filters
 */
export interface IntegrationListFilters {
  category?: IntegrationCategory;
  provider?: IntegrationProvider;
  status?: IntegrationStatus;
  search?: string;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  id: IntegrationProvider;
  name: string;
  category: IntegrationCategory;
  description: string;
  icon: string;
  authTypes: AuthType[];
  features: string[];
  docUrl: string;
  available: boolean;
}

/**
 * Provider configurations
 */
export const INTEGRATION_PROVIDERS: Record<IntegrationProvider, ProviderConfig> = {
  // SCM Providers
  github: {
    id: 'github',
    name: 'GitHub',
    category: 'scm',
    description: 'Connect to GitHub repositories for code scanning',
    icon: 'github',
    authTypes: ['oauth', 'token', 'app'],
    features: ['repositories', 'code_scanning', 'webhooks'],
    docUrl: 'https://docs.github.com',
    available: true,
  },
  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    category: 'scm',
    description: 'Connect to GitLab projects for code scanning',
    icon: 'gitlab',
    authTypes: ['oauth', 'token'],
    features: ['repositories', 'code_scanning', 'webhooks'],
    docUrl: 'https://docs.gitlab.com',
    available: true,
  },
  bitbucket: {
    id: 'bitbucket',
    name: 'Bitbucket',
    category: 'scm',
    description: 'Connect to Bitbucket repositories for code scanning',
    icon: 'bitbucket',
    authTypes: ['oauth', 'token', 'app'],
    features: ['repositories', 'code_scanning', 'webhooks'],
    docUrl: 'https://developer.atlassian.com/bitbucket',
    available: true,
  },
  azure_devops: {
    id: 'azure_devops',
    name: 'Azure DevOps',
    category: 'scm',
    description: 'Connect to Azure Repos for code scanning',
    icon: 'azure',
    authTypes: ['oauth', 'token'],
    features: ['repositories', 'code_scanning', 'pipelines'],
    docUrl: 'https://docs.microsoft.com/azure/devops',
    available: true,
  },

  // Security Tools
  wiz: {
    id: 'wiz',
    name: 'Wiz',
    category: 'security',
    description: 'Import cloud security findings from Wiz',
    icon: 'wiz',
    authTypes: ['api_key'],
    features: ['findings', 'assets', 'compliance'],
    docUrl: 'https://docs.wiz.io',
    available: false,
  },
  snyk: {
    id: 'snyk',
    name: 'Snyk',
    category: 'security',
    description: 'Import vulnerability findings from Snyk',
    icon: 'snyk',
    authTypes: ['api_key', 'token'],
    features: ['findings', 'sbom', 'license'],
    docUrl: 'https://docs.snyk.io',
    available: false,
  },
  tenable: {
    id: 'tenable',
    name: 'Tenable',
    category: 'security',
    description: 'Import vulnerability scan results from Tenable',
    icon: 'tenable',
    authTypes: ['api_key'],
    features: ['findings', 'assets', 'compliance'],
    docUrl: 'https://docs.tenable.com',
    available: false,
  },
  crowdstrike: {
    id: 'crowdstrike',
    name: 'CrowdStrike',
    category: 'security',
    description: 'Import endpoint security data from CrowdStrike',
    icon: 'crowdstrike',
    authTypes: ['api_key', 'oauth'],
    features: ['findings', 'assets', 'threats'],
    docUrl: 'https://falcon.crowdstrike.com/documentation',
    available: false,
  },

  // Ticketing
  jira: {
    id: 'jira',
    name: 'Jira',
    category: 'ticketing',
    description: 'Create and sync issues with Jira',
    icon: 'jira',
    authTypes: ['oauth', 'token', 'basic'],
    features: ['issues', 'webhooks', 'sync'],
    docUrl: 'https://developer.atlassian.com/cloud/jira',
    available: false,
  },
  linear: {
    id: 'linear',
    name: 'Linear',
    category: 'ticketing',
    description: 'Create and sync issues with Linear',
    icon: 'linear',
    authTypes: ['oauth', 'api_key'],
    features: ['issues', 'webhooks', 'sync'],
    docUrl: 'https://developers.linear.app',
    available: false,
  },
  asana: {
    id: 'asana',
    name: 'Asana',
    category: 'ticketing',
    description: 'Create and sync tasks with Asana',
    icon: 'asana',
    authTypes: ['oauth', 'token'],
    features: ['tasks', 'projects', 'sync'],
    docUrl: 'https://developers.asana.com',
    available: false,
  },

  // Cloud Providers
  aws: {
    id: 'aws',
    name: 'Amazon Web Services',
    category: 'cloud',
    description: 'Connect to AWS for cloud asset inventory',
    icon: 'aws',
    authTypes: ['api_key'],
    features: ['assets', 'findings', 'compliance'],
    docUrl: 'https://docs.aws.amazon.com',
    available: false,
  },
  gcp: {
    id: 'gcp',
    name: 'Google Cloud Platform',
    category: 'cloud',
    description: 'Connect to GCP for cloud asset inventory',
    icon: 'gcp',
    authTypes: ['oauth', 'api_key'],
    features: ['assets', 'findings', 'compliance'],
    docUrl: 'https://cloud.google.com/docs',
    available: false,
  },
  azure: {
    id: 'azure',
    name: 'Microsoft Azure',
    category: 'cloud',
    description: 'Connect to Azure for cloud asset inventory',
    icon: 'azure',
    authTypes: ['oauth', 'api_key'],
    features: ['assets', 'findings', 'compliance'],
    docUrl: 'https://docs.microsoft.com/azure',
    available: false,
  },

  // Notifications
  slack: {
    id: 'slack',
    name: 'Slack',
    category: 'notification',
    description: 'Send notifications to Slack channels',
    icon: 'slack',
    authTypes: ['oauth', 'token'],
    features: ['notifications', 'alerts', 'commands'],
    docUrl: 'https://api.slack.com',
    available: false,
  },
  teams: {
    id: 'teams',
    name: 'Microsoft Teams',
    category: 'notification',
    description: 'Send notifications to Teams channels',
    icon: 'teams',
    authTypes: ['oauth', 'token'],
    features: ['notifications', 'alerts'],
    docUrl: 'https://docs.microsoft.com/microsoftteams',
    available: false,
  },
  email: {
    id: 'email',
    name: 'Email',
    category: 'notification',
    description: 'Send email notifications',
    icon: 'email',
    authTypes: ['basic', 'api_key'],
    features: ['notifications', 'reports'],
    docUrl: '',
    available: false,
  },
  webhook: {
    id: 'webhook',
    name: 'Webhook',
    category: 'notification',
    description: 'Send notifications to custom webhooks',
    icon: 'webhook',
    authTypes: ['token', 'basic'],
    features: ['notifications', 'events'],
    docUrl: '',
    available: false,
  },
};

/**
 * Category configuration
 */
export const INTEGRATION_CATEGORIES: Record<IntegrationCategory, {
  label: string;
  description: string;
  icon: string;
}> = {
  scm: {
    label: 'Source Control',
    description: 'Connect to code repositories',
    icon: 'git-branch',
  },
  security: {
    label: 'Security Tools',
    description: 'Import security findings',
    icon: 'shield',
  },
  ticketing: {
    label: 'Issue Tracking',
    description: 'Create and sync issues',
    icon: 'ticket',
  },
  cloud: {
    label: 'Cloud Providers',
    description: 'Cloud asset inventory',
    icon: 'cloud',
  },
  notification: {
    label: 'Notifications',
    description: 'Send alerts and notifications',
    icon: 'bell',
  },
};

/**
 * Status configuration
 */
export const INTEGRATION_STATUS_CONFIG: Record<IntegrationStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  connected: {
    label: 'Connected',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
  },
  disconnected: {
    label: 'Disconnected',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500',
  },
  error: {
    label: 'Error',
    color: 'text-red-500',
    bgColor: 'bg-red-500',
  },
  pending: {
    label: 'Pending',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
  },
  expired: {
    label: 'Expired',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
  },
};
