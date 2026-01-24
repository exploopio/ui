/**
 * Finding Types
 *
 * Type definitions for security findings/vulnerabilities
 * Based on HackerOne/Bugcrowd style vulnerability management
 */

import type { Severity } from "@/features/shared/types";

// ============================================
// FINDING STATUS (Workflow-based)
// ============================================

export type FindingStatus =
  | "new" // Moi phat hien
  | "triaged" // Da phan loai
  | "confirmed" // Xac nhan la valid
  | "in_progress" // Dang xu ly
  | "resolved" // Da giai quyet
  | "verified" // Da verify fix
  | "closed" // Da dong
  | "duplicate" // Trung lap
  | "false_positive"; // False positive

export const FINDING_STATUS_CONFIG: Record<
  FindingStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    icon: string;
  }
> = {
  new: {
    label: "New",
    color: "border-blue-500/50",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
    icon: "circle-dot",
  },
  triaged: {
    label: "Triaged",
    color: "border-purple-500/50",
    bgColor: "bg-purple-500/20",
    textColor: "text-purple-400",
    icon: "filter",
  },
  confirmed: {
    label: "Confirmed",
    color: "border-green-500/50",
    bgColor: "bg-green-500/20",
    textColor: "text-green-400",
    icon: "check-circle",
  },
  in_progress: {
    label: "In Progress",
    color: "border-yellow-500/50",
    bgColor: "bg-yellow-500/20",
    textColor: "text-yellow-400",
    icon: "loader",
  },
  resolved: {
    label: "Resolved",
    color: "border-emerald-500/50",
    bgColor: "bg-emerald-500/20",
    textColor: "text-emerald-400",
    icon: "check",
  },
  verified: {
    label: "Verified",
    color: "border-teal-500/50",
    bgColor: "bg-teal-500/20",
    textColor: "text-teal-400",
    icon: "shield-check",
  },
  closed: {
    label: "Closed",
    color: "border-gray-500/50",
    bgColor: "bg-gray-500/20",
    textColor: "text-gray-400",
    icon: "x-circle",
  },
  duplicate: {
    label: "Duplicate",
    color: "border-orange-500/50",
    bgColor: "bg-orange-500/20",
    textColor: "text-orange-400",
    icon: "copy",
  },
  false_positive: {
    label: "False Positive",
    color: "border-red-500/50",
    bgColor: "bg-red-500/20",
    textColor: "text-red-400",
    icon: "x",
  },
};

// Status transitions workflow
export const STATUS_TRANSITIONS: Record<FindingStatus, FindingStatus[]> = {
  new: ["triaged", "duplicate", "false_positive"],
  triaged: ["confirmed", "duplicate", "false_positive"],
  confirmed: ["in_progress", "resolved", "duplicate", "false_positive"],
  in_progress: ["resolved", "confirmed"],
  resolved: ["verified", "confirmed"], // reopened goes back to confirmed
  verified: ["closed", "confirmed"], // reopened goes back to confirmed
  closed: ["confirmed"], // reopened
  duplicate: ["confirmed"], // reopened
  false_positive: ["confirmed"], // reopened
};

// ============================================
// SEVERITY
// ============================================

export const SEVERITY_CONFIG: Record<
  Severity,
  {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    cvssRange: string;
  }
> = {
  critical: {
    label: "Critical",
    color: "border-red-500/50",
    bgColor: "bg-red-500/20",
    textColor: "text-red-400",
    cvssRange: "9.0 - 10.0",
  },
  high: {
    label: "High",
    color: "border-orange-500/50",
    bgColor: "bg-orange-500/20",
    textColor: "text-orange-400",
    cvssRange: "7.0 - 8.9",
  },
  medium: {
    label: "Medium",
    color: "border-yellow-500/50",
    bgColor: "bg-yellow-500/20",
    textColor: "text-yellow-400",
    cvssRange: "4.0 - 6.9",
  },
  low: {
    label: "Low",
    color: "border-green-500/50",
    bgColor: "bg-green-500/20",
    textColor: "text-green-400",
    cvssRange: "0.1 - 3.9",
  },
  info: {
    label: "Info",
    color: "border-gray-500/50",
    bgColor: "bg-gray-500/20",
    textColor: "text-gray-400",
    cvssRange: "0",
  },
};

// ============================================
// USER
// ============================================

export type UserRole = "admin" | "analyst" | "developer" | "viewer";

export interface FindingUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

// ============================================
// AFFECTED ASSET
// ============================================

export type AssetType =
  | "domain"
  | "website"
  | "service"
  | "ip"
  | "repository"
  | "cloud";

export interface AffectedAsset {
  id: string;
  type: AssetType;
  name: string;
  url?: string;
  criticality?: Severity;
}

// ============================================
// EVIDENCE
// ============================================

export type EvidenceType =
  | "screenshot"
  | "video"
  | "log"
  | "request"
  | "response"
  | "code"
  | "file";

export interface Evidence {
  id: string;
  type: EvidenceType;
  title: string;
  content: string; // URL or base64 or text
  mimeType?: string;
  createdAt: string;
  createdBy: FindingUser;
}

export const EVIDENCE_TYPE_CONFIG: Record<
  EvidenceType,
  { label: string; icon: string }
> = {
  screenshot: { label: "Screenshot", icon: "image" },
  video: { label: "Video", icon: "video" },
  log: { label: "Log Entry", icon: "file-text" },
  request: { label: "HTTP Request", icon: "arrow-up-right" },
  response: { label: "HTTP Response", icon: "arrow-down-left" },
  code: { label: "Code/Payload", icon: "code" },
  file: { label: "File", icon: "paperclip" },
};

// ============================================
// REMEDIATION
// ============================================

export type RemediationStepStatus = "pending" | "in_progress" | "completed";

export interface RemediationStep {
  id: string;
  description: string;
  status: RemediationStepStatus;
  completedBy?: FindingUser;
  completedAt?: string;
}

export interface Remediation {
  description: string;
  steps: RemediationStep[];
  references: string[];
  deadline?: string;
  progress: number; // 0-100
}

// ============================================
// ACTIVITY
// ============================================

export type ActivityType =
  | "created"
  | "ai_triage"
  | "status_changed"
  | "severity_changed"
  | "assigned"
  | "unassigned"
  | "comment"
  | "internal_note"
  | "evidence_added"
  | "remediation_started"
  | "remediation_updated"
  | "verified"
  | "reopened"
  | "linked"
  | "duplicate_marked"
  | "false_positive_marked";

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface Reaction {
  emoji: string;
  users: FindingUser[];
  count: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  actor: FindingUser | "system" | "ai";
  content?: string;
  metadata?: Record<string, unknown>;

  // For status/severity changes
  previousValue?: string;
  newValue?: string;
  reason?: string;

  // For comments
  isInternal?: boolean;
  attachments?: Attachment[];
  reactions?: Reaction[];
  replies?: Activity[];

  // Timestamps
  createdAt: string;
  editedAt?: string;
}

export const ACTIVITY_TYPE_CONFIG: Record<
  ActivityType,
  { label: string; icon: string; color: string }
> = {
  created: {
    label: "Created",
    icon: "plus-circle",
    color: "text-blue-400",
  },
  ai_triage: {
    label: "AI Analysis",
    icon: "bot",
    color: "text-purple-400",
  },
  status_changed: {
    label: "Status Changed",
    icon: "arrow-right-left",
    color: "text-yellow-400",
  },
  severity_changed: {
    label: "Severity Changed",
    icon: "gauge",
    color: "text-orange-400",
  },
  assigned: {
    label: "Assigned",
    icon: "user-plus",
    color: "text-green-400",
  },
  unassigned: {
    label: "Unassigned",
    icon: "user-minus",
    color: "text-gray-400",
  },
  comment: {
    label: "Comment",
    icon: "message-square",
    color: "text-blue-400",
  },
  internal_note: {
    label: "Internal Note",
    icon: "lock",
    color: "text-amber-400",
  },
  evidence_added: {
    label: "Evidence Added",
    icon: "file-plus",
    color: "text-green-400",
  },
  remediation_started: {
    label: "Remediation Started",
    icon: "wrench",
    color: "text-blue-400",
  },
  remediation_updated: {
    label: "Remediation Updated",
    icon: "refresh-cw",
    color: "text-blue-400",
  },
  verified: {
    label: "Verified",
    icon: "shield-check",
    color: "text-green-400",
  },
  reopened: {
    label: "Reopened",
    icon: "rotate-ccw",
    color: "text-orange-400",
  },
  linked: {
    label: "Linked",
    icon: "link",
    color: "text-blue-400",
  },
  duplicate_marked: {
    label: "Marked Duplicate",
    icon: "copy",
    color: "text-orange-400",
  },
  false_positive_marked: {
    label: "Marked False Positive",
    icon: "x-circle",
    color: "text-red-400",
  },
};

// ============================================
// AI TRIAGE
// ============================================

export interface AITriageResult {
  risk: Severity;
  cvss: number;
  exploitability: "none" | "low" | "medium" | "high" | "critical";
  affectedAssets: number;
  summary: string;
  recommendations: string[];
  references: string[];
}

// ============================================
// RELATED FINDING
// ============================================

export interface RelatedFinding {
  id: string;
  title: string;
  severity: Severity;
  status: FindingStatus;
  assetName: string;
  similarity?: number; // percentage
  linkType?: "similar" | "related" | "duplicate";
}

// ============================================
// MAIN FINDING MODEL
// ============================================

export type FindingSource =
  | "sast"      // Static Application Security Testing (Semgrep, CodeQL, etc.)
  | "dast"      // Dynamic Application Security Testing (ZAP, Burp, Nuclei)
  | "sca"       // Software Composition Analysis (Trivy, Snyk, Grype)
  | "secret"    // Secret detection (Gitleaks, Trufflehog)
  | "iac"       // Infrastructure as Code (Checkov, Tfsec)
  | "container" // Container scanning
  | "manual"    // Manual findings
  | "external"; // External sources

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: FindingStatus;

  // Technical Details
  cvss?: number;
  cvssVector?: string;
  cve?: string;
  cwe?: string;
  owasp?: string;
  tags?: string[];

  // Location Info (file path, line numbers)
  filePath?: string;
  startLine?: number;
  endLine?: number;
  startColumn?: number;
  endColumn?: number;

  // Scanner/Tool Info
  ruleId?: string;
  ruleName?: string;
  toolName?: string;
  toolVersion?: string;

  // Code snippet
  snippet?: string;

  // Affected Assets
  assets: AffectedAsset[];

  // Evidence
  evidence: Evidence[];

  // Remediation
  remediation: Remediation;

  // Assignment
  assignee?: FindingUser;
  team?: string;

  // Metadata
  source: FindingSource;
  scanner?: string;
  scanId?: string;

  // Relations
  duplicateOf?: string;
  relatedFindings: string[];
  remediationTaskId?: string;

  // Timestamps
  discoveredAt: string;
  triagedAt?: string;
  resolvedAt?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// FINDING DETAIL (Extended for detail page)
// ============================================

export interface FindingDetail extends Finding {
  activities: Activity[];
  similarFindings?: RelatedFinding[];
  linkedFindings?: RelatedFinding[];
  sameCveFindings?: RelatedFinding[];
}

// ============================================
// STATISTICS
// ============================================

export interface FindingStats {
  total: number;
  bySeverity: Record<Severity, number>;
  byStatus: Record<FindingStatus, number>;
  averageCvss: number;
  overdueCount: number;
  resolvedThisWeek: number;
  newThisWeek: number;
}

// ============================================
// ASSIGNABLE USERS (for dropdowns)
// ============================================

export const MOCK_USERS: FindingUser[] = [
  {
    id: "usr-001",
    name: "Nguyen Van An",
    email: "an.nguyen@rediver.io",
    role: "analyst",
  },
  {
    id: "usr-002",
    name: "Tran Thi Binh",
    email: "binh.tran@rediver.io",
    role: "analyst",
  },
  {
    id: "usr-003",
    name: "Le Van Cuong",
    email: "cuong.le@rediver.io",
    role: "developer",
  },
  {
    id: "usr-004",
    name: "Pham Thi Dung",
    email: "dung.pham@rediver.io",
    role: "admin",
  },
  {
    id: "usr-005",
    name: "Security Lead",
    email: "lead@rediver.io",
    role: "admin",
  },
];
