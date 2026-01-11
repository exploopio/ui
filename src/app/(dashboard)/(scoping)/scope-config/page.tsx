"use client";

import { useState, useMemo, useCallback } from "react";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { PageHeader } from "@/features/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Globe,
  Shield,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
  Server,
  Code,
  Cloud,
  GitBranch,
  Target,
  Ban,
  Calendar,
  Play,
  Search as SearchIcon,
  AlertTriangle,
  Database,
  Box,
  Mail,
  Folder,
  Link,
} from "lucide-react";
import { toast } from "sonner";
import {
  type ScopeTargetType,
  type ScopeTargetStatus,
  type ScanType,
  type ScanFrequency,
  getScopeTypeConfig,
} from "@/features/scope";

// Use shared validation from scope feature types
const validatePattern = (type: ScopeTargetType, pattern: string): { valid: boolean; error?: string } => {
  if (!pattern.trim()) {
    return { valid: false, error: "Pattern is required" };
  }

  const config = getScopeTypeConfig(type);
  if (!config) {
    return { valid: true }; // Allow if no config (generic type)
  }

  if (!config.validation.pattern.test(pattern)) {
    return { valid: false, error: config.validation.message };
  }

  // Additional IP validation
  if (type === "ip_range" || type === "ip_address") {
    const ipPart = pattern.split("/")[0];
    const octets = ipPart.split(".").map(Number);
    if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) {
      return { valid: false, error: "IP octets must be between 0-255" };
    }
    if (pattern.includes("/")) {
      const cidr = parseInt(pattern.split("/")[1]);
      if (isNaN(cidr) || cidr < 0 || cidr > 32) {
        return { valid: false, error: "CIDR must be between 0-32" };
      }
    }
  }

  return { valid: true };
};

// Extended types using shared scope types
interface ScopeTarget {
  id: string;
  type: ScopeTargetType;
  pattern: string;
  description: string;
  status: ScopeTargetStatus;
  priority?: "critical" | "high" | "medium" | "low";
  addedAt: string;
  addedBy: string;
}

interface Exclusion {
  id: string;
  type: ScopeTargetType;
  pattern: string;
  reason: string;
  status: ScopeTargetStatus;
  addedAt: string;
  addedBy: string;
}

interface ScanSchedule {
  id: string;
  name: string;
  type: ScanType;
  targets: string[];
  frequency: ScanFrequency;
  time: string;
  lastRun: string | null;
  nextRun: string | null;
  status: "active" | "paused";
}

// Mock data for scope targets
const mockScopeTargets: ScopeTarget[] = [
  {
    id: "scope-001",
    type: "domain",
    pattern: "*.techcombank.com.vn",
    description: "Main banking domain and subdomains",
    status: "active",
    addedAt: "2024-01-15",
    addedBy: "Nguyen Van An",
  },
  {
    id: "scope-002",
    type: "domain",
    pattern: "*.tcb.com.vn",
    description: "Short domain alias",
    status: "active",
    addedAt: "2024-01-15",
    addedBy: "Nguyen Van An",
  },
  {
    id: "scope-003",
    type: "ip_range",
    pattern: "10.0.0.0/8",
    description: "Internal network range",
    status: "active",
    addedAt: "2024-01-20",
    addedBy: "Tran Thi Binh",
  },
  {
    id: "scope-004",
    type: "domain",
    pattern: "api.techcombank.com.vn",
    description: "API Gateway endpoint",
    status: "active",
    addedAt: "2024-02-01",
    addedBy: "Le Van Cuong",
  },
  {
    id: "scope-005",
    type: "repository",
    pattern: "github.com/techcombank/*",
    description: "All GitHub repositories",
    status: "active",
    addedAt: "2024-02-10",
    addedBy: "Pham Thi Dung",
  },
  {
    id: "scope-006",
    type: "cloud_account",
    pattern: "AWS:123456789012",
    description: "Production AWS account",
    status: "active",
    addedAt: "2024-02-15",
    addedBy: "Nguyen Van An",
  },
];

const mockExclusions: Exclusion[] = [
  {
    id: "excl-001",
    type: "domain",
    pattern: "status.techcombank.com.vn",
    reason: "Third-party status page service",
    status: "active",
    addedAt: "2024-01-16",
    addedBy: "Nguyen Van An",
  },
  {
    id: "excl-002",
    type: "ip_range",
    pattern: "10.255.0.0/16",
    reason: "Guest network - out of scope",
    status: "active",
    addedAt: "2024-01-20",
    addedBy: "Tran Thi Binh",
  },
  {
    id: "excl-003",
    type: "domain",
    pattern: "*.cdn.techcombank.com.vn",
    reason: "CDN managed by third-party",
    status: "active",
    addedAt: "2024-02-05",
    addedBy: "Le Van Cuong",
  },
  {
    id: "excl-004",
    type: "path",
    pattern: "/health",
    reason: "Health check endpoints",
    status: "active",
    addedAt: "2024-02-10",
    addedBy: "Pham Thi Dung",
  },
];

const mockScanSchedules: ScanSchedule[] = [
  {
    id: "sched-001",
    name: "Daily Vulnerability Scan",
    type: "vulnerability",
    targets: ["*.techcombank.com.vn"],
    frequency: "daily",
    time: "02:00",
    lastRun: "2024-03-10T02:00:00",
    nextRun: "2024-03-11T02:00:00",
    status: "active",
  },
  {
    id: "sched-002",
    name: "Weekly Port Scan",
    type: "port_scan",
    targets: ["10.0.0.0/8"],
    frequency: "weekly",
    time: "Sunday 03:00",
    lastRun: "2024-03-03T03:00:00",
    nextRun: "2024-03-10T03:00:00",
    status: "active",
  },
  {
    id: "sched-003",
    name: "Monthly Penetration Test",
    type: "pentest",
    targets: ["api.techcombank.com.vn"],
    frequency: "monthly",
    time: "1st day 04:00",
    lastRun: "2024-03-01T04:00:00",
    nextRun: "2024-04-01T04:00:00",
    status: "active",
  },
  {
    id: "sched-004",
    name: "Credential Leak Monitor",
    type: "credential",
    targets: ["*@techcombank.com.vn"],
    frequency: "continuous",
    time: "Real-time",
    lastRun: "2024-03-10T10:30:00",
    nextRun: null,
    status: "active",
  },
  {
    id: "sched-005",
    name: "Repository Secret Scan",
    type: "secret_scan",
    targets: ["github.com/techcombank/*"],
    frequency: "on_commit",
    time: "On push",
    lastRun: "2024-03-10T09:15:00",
    nextRun: null,
    status: "paused",
  },
];

// Extended icon mapping for all scope target types
const targetTypeIcons: Record<string, React.ReactNode> = {
  // Network & External
  domain: <Globe className="h-4 w-4" />,
  subdomain: <Globe className="h-4 w-4" />,
  ip_address: <Server className="h-4 w-4" />,
  ip_range: <Server className="h-4 w-4" />,
  certificate: <Shield className="h-4 w-4" />,
  // Applications
  api: <Code className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
  mobile_app: <Box className="h-4 w-4" />,
  // Cloud
  cloud_account: <Cloud className="h-4 w-4" />,
  cloud_resource: <Cloud className="h-4 w-4" />,
  // Infrastructure
  database: <Database className="h-4 w-4" />,
  container: <Box className="h-4 w-4" />,
  host: <Server className="h-4 w-4" />,
  network: <Link className="h-4 w-4" />,
  // Code & CI/CD
  repository: <GitBranch className="h-4 w-4" />,
  // Generic
  path: <Folder className="h-4 w-4" />,
  email_domain: <Mail className="h-4 w-4" />,
};

// Type categories for grouped dropdown
const targetTypeCategories = [
  {
    label: "Network & External",
    types: ["domain", "subdomain", "ip_address", "ip_range", "certificate"],
  },
  {
    label: "Applications",
    types: ["api", "website", "mobile_app"],
  },
  {
    label: "Cloud",
    types: ["cloud_account", "cloud_resource"],
  },
  {
    label: "Infrastructure",
    types: ["database", "container", "host", "network"],
  },
  {
    label: "Code & CI/CD",
    types: ["repository"],
  },
  {
    label: "Other",
    types: ["path", "email_domain"],
  },
];

const scanTypeConfig: Record<string, { label: string; color: string }> = {
  vulnerability: { label: "Vulnerability", color: "bg-red-500/20 text-red-400" },
  port_scan: { label: "Port Scan", color: "bg-blue-500/20 text-blue-400" },
  pentest: { label: "Pentest", color: "bg-purple-500/20 text-purple-400" },
  credential: { label: "Credential", color: "bg-orange-500/20 text-orange-400" },
  secret_scan: { label: "Secret Scan", color: "bg-yellow-500/20 text-yellow-400" },
  compliance: { label: "Compliance", color: "bg-cyan-500/20 text-cyan-400" },
  configuration: { label: "Config Audit", color: "bg-indigo-500/20 text-indigo-400" },
};

export default function ScopeConfigPage() {
  // State for data
  const [targets, setTargets] = useState<ScopeTarget[]>(mockScopeTargets);
  const [exclusions, setExclusions] = useState<Exclusion[]>(mockExclusions);
  const [schedules, setSchedules] = useState<ScanSchedule[]>(mockScanSchedules);

  // Search & filter states
  const [targetSearch, setTargetSearch] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all");
  const [exclusionSearch, setExclusionSearch] = useState("");
  const [exclusionTypeFilter, setExclusionTypeFilter] = useState<string>("all");
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState<string>("all");

  // Validation error state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Dialog states
  const [isAddTargetOpen, setIsAddTargetOpen] = useState(false);
  const [isAddExclusionOpen, setIsAddExclusionOpen] = useState(false);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ScopeTarget | null>(null);
  const [editExclusion, setEditExclusion] = useState<Exclusion | null>(null);
  const [editSchedule, setEditSchedule] = useState<ScanSchedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScopeTarget | null>(null);
  const [deleteExclusion, setDeleteExclusion] = useState<Exclusion | null>(null);
  const [deleteSchedule, setDeleteSchedule] = useState<ScanSchedule | null>(null);

  // Form states
  const [targetForm, setTargetForm] = useState({
    type: "domain" as ScopeTargetType,
    pattern: "",
    description: "",
  });

  const [exclusionForm, setExclusionForm] = useState({
    type: "domain" as ScopeTargetType,
    pattern: "",
    reason: "",
  });

  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    type: "vulnerability" as ScanType,
    targets: "",
    frequency: "daily" as ScanFrequency,
    time: "",
  });

  // Filtered data
  const filteredTargets = useMemo(() => {
    return targets.filter((t) => {
      const matchesSearch =
        t.pattern.toLowerCase().includes(targetSearch.toLowerCase()) ||
        t.description.toLowerCase().includes(targetSearch.toLowerCase());
      const matchesType = targetTypeFilter === "all" || t.type === targetTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [targets, targetSearch, targetTypeFilter]);

  const filteredExclusions = useMemo(() => {
    return exclusions.filter((e) => {
      const matchesSearch =
        e.pattern.toLowerCase().includes(exclusionSearch.toLowerCase()) ||
        e.reason.toLowerCase().includes(exclusionSearch.toLowerCase());
      const matchesType = exclusionTypeFilter === "all" || e.type === exclusionTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [exclusions, exclusionSearch, exclusionTypeFilter]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
        s.targets.some((t) => t.toLowerCase().includes(scheduleSearch.toLowerCase()));
      const matchesType = scheduleTypeFilter === "all" || s.type === scheduleTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [schedules, scheduleSearch, scheduleTypeFilter]);

  // Stats with dynamic coverage calculation
  const stats = useMemo(() => {
    const activeTargets = targets.filter((t) => t.status === "active").length;
    const totalTargets = targets.length;
    const activeExclusions = exclusions.filter((e) => e.status === "active").length;

    // Coverage = (active targets - active exclusions) / total targets * 100
    // Simplified: percentage of active targets
    const coverage = totalTargets > 0
      ? Math.round((activeTargets / totalTargets) * 100 - (activeExclusions / Math.max(totalTargets, 1)) * 10)
      : 0;

    return {
      targets: targets.length,
      activeTargets,
      exclusions: exclusions.length,
      activeSchedules: schedules.filter((s) => s.status === "active").length,
      coverage: Math.max(0, Math.min(100, coverage)), // Clamp between 0-100
    };
  }, [targets, exclusions, schedules]);

  // Duplicate check helpers
  const checkDuplicateTarget = useCallback((pattern: string, excludeId?: string): boolean => {
    return targets.some((t) => t.pattern === pattern && t.id !== excludeId);
  }, [targets]);

  const checkDuplicateExclusion = useCallback((pattern: string, excludeId?: string): boolean => {
    return exclusions.some((e) => e.pattern === pattern && e.id !== excludeId);
  }, [exclusions]);

  // Toggle target status
  const toggleTargetStatus = (id: string) => {
    setTargets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "active" ? "inactive" : "active" }
          : t
      )
    );
    toast.success("Target status updated");
  };

  // Toggle exclusion status
  const toggleExclusionStatus = (id: string) => {
    setExclusions((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: e.status === "active" ? "inactive" : "active" }
          : e
      )
    );
    toast.success("Exclusion status updated");
  };

  const toggleScheduleStatus = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "active" ? "paused" : "active" }
          : s
      )
    );
    toast.success("Schedule status updated");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Target handlers
  const resetTargetForm = () => {
    setTargetForm({ type: "domain", pattern: "", description: "" });
    setValidationError(null);
  };

  const handleAddTarget = () => {
    // Validate pattern format
    const validation = validatePattern(targetForm.type, targetForm.pattern);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid pattern");
      return;
    }

    // Check for duplicates
    if (checkDuplicateTarget(targetForm.pattern)) {
      setValidationError("This pattern already exists in targets");
      return;
    }

    const newTarget: ScopeTarget = {
      id: `scope-${Date.now()}`,
      type: targetForm.type,
      pattern: targetForm.pattern,
      description: targetForm.description,
      status: "active",
      addedAt: new Date().toISOString().split("T")[0],
      addedBy: "Current User",
    };
    setTargets((prev) => [...prev, newTarget]);
    toast.success("Target added successfully");
    setIsAddTargetOpen(false);
    resetTargetForm();
  };

  const handleEditTarget = () => {
    if (!editTarget) return;

    // Validate pattern format
    const validation = validatePattern(targetForm.type, targetForm.pattern);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid pattern");
      return;
    }

    // Check for duplicates (exclude current target)
    if (checkDuplicateTarget(targetForm.pattern, editTarget.id)) {
      setValidationError("This pattern already exists in targets");
      return;
    }

    setTargets((prev) =>
      prev.map((t) =>
        t.id === editTarget.id
          ? {
              ...t,
              type: targetForm.type,
              pattern: targetForm.pattern,
              description: targetForm.description,
            }
          : t
      )
    );
    toast.success("Target updated successfully");
    setEditTarget(null);
    resetTargetForm();
  };

  const handleDeleteTarget = () => {
    if (!deleteTarget) return;
    setTargets((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    toast.success("Target removed successfully");
    setDeleteTarget(null);
  };

  const openEditTarget = (target: ScopeTarget) => {
    setTargetForm({
      type: target.type,
      pattern: target.pattern,
      description: target.description,
    });
    setEditTarget(target);
  };

  // Exclusion handlers
  const resetExclusionForm = () => {
    setExclusionForm({ type: "domain", pattern: "", reason: "" });
    setValidationError(null);
  };

  const handleAddExclusion = () => {
    // Validate pattern format
    const validation = validatePattern(exclusionForm.type, exclusionForm.pattern);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid pattern");
      return;
    }

    // Check for duplicates
    if (checkDuplicateExclusion(exclusionForm.pattern)) {
      setValidationError("This pattern already exists in exclusions");
      return;
    }

    const newExclusion: Exclusion = {
      id: `excl-${Date.now()}`,
      type: exclusionForm.type,
      pattern: exclusionForm.pattern,
      reason: exclusionForm.reason,
      status: "active",
      addedAt: new Date().toISOString().split("T")[0],
      addedBy: "Current User",
    };
    setExclusions((prev) => [...prev, newExclusion]);
    toast.success("Exclusion added successfully");
    setIsAddExclusionOpen(false);
    resetExclusionForm();
  };

  const handleEditExclusion = () => {
    if (!editExclusion) return;

    // Validate pattern format
    const validation = validatePattern(exclusionForm.type, exclusionForm.pattern);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid pattern");
      return;
    }

    // Check for duplicates (exclude current exclusion)
    if (checkDuplicateExclusion(exclusionForm.pattern, editExclusion.id)) {
      setValidationError("This pattern already exists in exclusions");
      return;
    }

    setExclusions((prev) =>
      prev.map((e) =>
        e.id === editExclusion.id
          ? {
              ...e,
              type: exclusionForm.type,
              pattern: exclusionForm.pattern,
              reason: exclusionForm.reason,
            }
          : e
      )
    );
    toast.success("Exclusion updated successfully");
    setEditExclusion(null);
    resetExclusionForm();
  };

  const handleDeleteExclusion = () => {
    if (!deleteExclusion) return;
    setExclusions((prev) => prev.filter((e) => e.id !== deleteExclusion.id));
    toast.success("Exclusion removed successfully");
    setDeleteExclusion(null);
  };

  const openEditExclusion = (exclusion: Exclusion) => {
    setExclusionForm({
      type: exclusion.type,
      pattern: exclusion.pattern,
      reason: exclusion.reason,
    });
    setEditExclusion(exclusion);
  };

  // Schedule handlers
  const resetScheduleForm = () => {
    setScheduleForm({ name: "", type: "vulnerability", targets: "", frequency: "daily", time: "" });
  };

  const handleAddSchedule = () => {
    if (!scheduleForm.name || !scheduleForm.targets) {
      toast.error("Please fill in required fields");
      return;
    }
    const newSchedule: ScanSchedule = {
      id: `sched-${Date.now()}`,
      name: scheduleForm.name,
      type: scheduleForm.type,
      targets: scheduleForm.targets.split(",").map((t) => t.trim()),
      frequency: scheduleForm.frequency,
      time: scheduleForm.time || "00:00",
      lastRun: null,
      nextRun: new Date().toISOString(),
      status: "active",
    };
    setSchedules((prev) => [...prev, newSchedule]);
    toast.success("Schedule created successfully");
    setIsAddScheduleOpen(false);
    resetScheduleForm();
  };

  const handleEditSchedule = () => {
    if (!editSchedule || !scheduleForm.name || !scheduleForm.targets) {
      toast.error("Please fill in required fields");
      return;
    }
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === editSchedule.id
          ? {
              ...s,
              name: scheduleForm.name,
              type: scheduleForm.type,
              targets: scheduleForm.targets.split(",").map((t) => t.trim()),
              frequency: scheduleForm.frequency,
              time: scheduleForm.time || "00:00",
            }
          : s
      )
    );
    toast.success("Schedule updated successfully");
    setEditSchedule(null);
    resetScheduleForm();
  };

  const handleDeleteSchedule = () => {
    if (!deleteSchedule) return;
    setSchedules((prev) => prev.filter((s) => s.id !== deleteSchedule.id));
    toast.success("Schedule deleted successfully");
    setDeleteSchedule(null);
  };

  const openEditSchedule = (schedule: ScanSchedule) => {
    setScheduleForm({
      name: schedule.name,
      type: schedule.type,
      targets: schedule.targets.join(", "),
      frequency: schedule.frequency,
      time: schedule.time,
    });
    setEditSchedule(schedule);
  };

  const handleRunNow = (schedule: ScanSchedule) => {
    toast.success(`Started: ${schedule.name}`);
  };

  // Get pattern placeholder and help text from shared config
  const getTypeConfig = (type: ScopeTargetType) => {
    const config = getScopeTypeConfig(type);
    return {
      placeholder: config?.placeholder || "Enter pattern",
      helpText: config?.helpText || "",
    };
  };

  // Format type label for display
  const formatTypeLabel = (type: string): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Form JSX
  const targetFormFields = (
    <div className="space-y-4">
      {validationError && (
        <div className="flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">
          <AlertTriangle className="h-4 w-4" />
          {validationError}
        </div>
      )}
      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={targetForm.type}
          onValueChange={(v) => {
            setTargetForm({ ...targetForm, type: v as ScopeTargetType });
            setValidationError(null);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {targetTypeCategories.map((category) => (
              <div key={category.label}>
                <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                  {category.label}
                </div>
                {category.types.map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      {targetTypeIcons[type]}
                      {formatTypeLabel(type)}
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Pattern *</Label>
        <Input
          placeholder={getTypeConfig(targetForm.type).placeholder}
          value={targetForm.pattern}
          onChange={(e) => {
            setTargetForm({ ...targetForm, pattern: e.target.value });
            setValidationError(null);
          }}
        />
        <p className="text-muted-foreground text-xs">
          {getTypeConfig(targetForm.type).helpText}
        </p>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          placeholder="Description of this target"
          value={targetForm.description}
          onChange={(e) => setTargetForm({ ...targetForm, description: e.target.value })}
        />
      </div>
    </div>
  );

  const exclusionFormFields = (
    <div className="space-y-4">
      {validationError && (
        <div className="flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">
          <AlertTriangle className="h-4 w-4" />
          {validationError}
        </div>
      )}
      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={exclusionForm.type}
          onValueChange={(v) => {
            setExclusionForm({ ...exclusionForm, type: v as ScopeTargetType });
            setValidationError(null);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {targetTypeCategories.map((category) => (
              <div key={category.label}>
                <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                  {category.label}
                </div>
                {category.types.map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      {targetTypeIcons[type]}
                      {formatTypeLabel(type)}
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Pattern *</Label>
        <Input
          placeholder={getTypeConfig(exclusionForm.type).placeholder}
          value={exclusionForm.pattern}
          onChange={(e) => {
            setExclusionForm({ ...exclusionForm, pattern: e.target.value });
            setValidationError(null);
          }}
        />
        <p className="text-muted-foreground text-xs">
          Pattern to exclude from security assessments
        </p>
      </div>
      <div className="space-y-2">
        <Label>Reason</Label>
        <Input
          placeholder="Reason for exclusion"
          value={exclusionForm.reason}
          onChange={(e) => setExclusionForm({ ...exclusionForm, reason: e.target.value })}
        />
      </div>
    </div>
  );

  const scheduleFormFields = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input
          placeholder="e.g., Daily Vulnerability Scan"
          value={scheduleForm.name}
          onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Scan Type</Label>
          <Select
            value={scheduleForm.type}
            onValueChange={(v) => setScheduleForm({ ...scheduleForm, type: v as ScanType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vulnerability">Vulnerability Scan</SelectItem>
              <SelectItem value="port_scan">Port Scan</SelectItem>
              <SelectItem value="pentest">Penetration Test</SelectItem>
              <SelectItem value="credential">Credential Monitor</SelectItem>
              <SelectItem value="secret_scan">Secret Scan</SelectItem>
              <SelectItem value="compliance">Compliance Check</SelectItem>
              <SelectItem value="configuration">Config Audit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select
            value={scheduleForm.frequency}
            onValueChange={(v) => setScheduleForm({ ...scheduleForm, frequency: v as ScanFrequency })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="continuous">Continuous</SelectItem>
              <SelectItem value="on_commit">On Commit</SelectItem>
              <SelectItem value="on_demand">On Demand</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Targets *</Label>
        <Input
          placeholder="Comma-separated targets (e.g., *.example.com, 10.0.0.0/8)"
          value={scheduleForm.targets}
          onChange={(e) => setScheduleForm({ ...scheduleForm, targets: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Time</Label>
        <Input
          placeholder="e.g., 02:00 or Sunday 03:00"
          value={scheduleForm.time}
          onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <>
      <Header fixed>
        <div className="ms-auto flex items-center gap-2 sm:gap-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <PageHeader
          title="Scope Configuration"
          description="Configure scan targets, exclusions, and schedules"
        />

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                In-Scope Targets
              </CardDescription>
              <CardTitle className="text-3xl">{stats.targets}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Ban className="h-4 w-4" />
                Exclusions
              </CardDescription>
              <CardTitle className="text-3xl">{stats.exclusions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Scheduled Scans
              </CardDescription>
              <CardTitle className="text-3xl">{stats.activeSchedules}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Coverage
              </CardDescription>
              <CardTitle className={`text-3xl ${stats.coverage >= 80 ? "text-green-500" : stats.coverage >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                {stats.coverage}%
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground text-xs">
                {stats.activeTargets} of {stats.targets} targets active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="targets" className="mt-6">
          <TabsList>
            <TabsTrigger value="targets">
              In-Scope Targets ({targets.length})
            </TabsTrigger>
            <TabsTrigger value="exclusions">
              Exclusions ({exclusions.length})
            </TabsTrigger>
            <TabsTrigger value="schedules">
              Scan Schedules ({schedules.length})
            </TabsTrigger>
          </TabsList>

          {/* In-Scope Targets */}
          <TabsContent value="targets">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>In-Scope Targets</CardTitle>
                    <CardDescription>
                      Assets and patterns included in security assessments
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsAddTargetOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Target
                  </Button>
                </div>
                {/* Search & Filter */}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder="Search targets..."
                      value={targetSearch}
                      onChange={(e) => setTargetSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      <SelectItem value="all">All Types</SelectItem>
                      {targetTypeCategories.map((category) => (
                        <div key={category.label}>
                          <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                            {category.label}
                          </div>
                          {category.types.map((type) => (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                {targetTypeIcons[type]}
                                {formatTypeLabel(type)}
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Pattern</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTargets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                          {targetSearch || targetTypeFilter !== "all"
                            ? "No targets match your search criteria"
                            : "No targets configured"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTargets.map((target) => (
                        <TableRow key={target.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {targetTypeIcons[target.type]}
                              <span className="text-sm capitalize">
                                {target.type.replace("_", " ")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-muted rounded px-2 py-1 text-sm">
                              {target.pattern}
                            </code>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {target.description}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={target.status === "active"}
                                onCheckedChange={() => toggleTargetStatus(target.id)}
                              />
                              <span className={`text-xs ${target.status === "active" ? "text-green-400" : "text-gray-400"}`}>
                                {target.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {target.addedBy}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditTarget(target)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-400"
                                  onClick={() => setDeleteTarget(target)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exclusions */}
          <TabsContent value="exclusions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Exclusions</CardTitle>
                    <CardDescription>
                      Assets and patterns excluded from security assessments
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsAddExclusionOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Exclusion
                  </Button>
                </div>
                {/* Search & Filter */}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder="Search exclusions..."
                      value={exclusionSearch}
                      onChange={(e) => setExclusionSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={exclusionTypeFilter} onValueChange={setExclusionTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      <SelectItem value="all">All Types</SelectItem>
                      {targetTypeCategories.map((category) => (
                        <div key={category.label}>
                          <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                            {category.label}
                          </div>
                          {category.types.map((type) => (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                {targetTypeIcons[type]}
                                {formatTypeLabel(type)}
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Pattern</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExclusions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                          {exclusionSearch || exclusionTypeFilter !== "all"
                            ? "No exclusions match your search criteria"
                            : "No exclusions configured"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExclusions.map((exclusion) => (
                        <TableRow key={exclusion.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {targetTypeIcons[exclusion.type] || <Ban className="h-4 w-4" />}
                              <span className="text-sm capitalize">
                                {exclusion.type.replace("_", " ")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-muted rounded px-2 py-1 text-sm">
                              {exclusion.pattern}
                            </code>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {exclusion.reason}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={exclusion.status === "active"}
                                onCheckedChange={() => toggleExclusionStatus(exclusion.id)}
                              />
                              <span className={`text-xs ${exclusion.status === "active" ? "text-orange-400" : "text-gray-400"}`}>
                                {exclusion.status === "active" ? "Excluded" : "Inactive"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {exclusion.addedBy}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditExclusion(exclusion)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-400"
                                  onClick={() => setDeleteExclusion(exclusion)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scan Schedules */}
          <TabsContent value="schedules">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Scan Schedules</CardTitle>
                    <CardDescription>
                      Automated scan configurations and schedules
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsAddScheduleOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Schedule
                  </Button>
                </div>
                {/* Search & Filter */}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder="Search schedules..."
                      value={scheduleSearch}
                      onChange={(e) => setScheduleSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={scheduleTypeFilter} onValueChange={setScheduleTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="vulnerability">Vulnerability</SelectItem>
                      <SelectItem value="port_scan">Port Scan</SelectItem>
                      <SelectItem value="pentest">Pentest</SelectItem>
                      <SelectItem value="credential">Credential</SelectItem>
                      <SelectItem value="secret_scan">Secret Scan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchedules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                          {scheduleSearch || scheduleTypeFilter !== "all"
                            ? "No schedules match your search criteria"
                            : "No schedules configured"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSchedules.map((schedule) => {
                        const typeConfig = scanTypeConfig[schedule.type];
                        return (
                          <TableRow key={schedule.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{schedule.name}</p>
                                <p className="text-muted-foreground text-xs">
                                  {schedule.targets.join(", ")}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${typeConfig.color} border-0`}>
                                {typeConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="text-muted-foreground h-3 w-3" />
                                {schedule.time}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(schedule.lastRun)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {schedule.nextRun ? formatDate(schedule.nextRun) : "On trigger"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={schedule.status === "active"}
                                  onCheckedChange={() => toggleScheduleStatus(schedule.id)}
                                />
                                <span className="text-xs capitalize">{schedule.status}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleRunNow(schedule)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Run Now
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditSchedule(schedule)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-400"
                                    onClick={() => setDeleteSchedule(schedule)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>

      {/* Add Target Dialog */}
      <Dialog open={isAddTargetOpen} onOpenChange={(open) => {
        setIsAddTargetOpen(open);
        if (!open) {
          resetTargetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Target</DialogTitle>
            <DialogDescription>Add a new target to the scope</DialogDescription>
          </DialogHeader>
          {targetFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTargetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTarget}>Add Target</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Target Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => {
        if (!open) {
          setEditTarget(null);
          resetTargetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Target</DialogTitle>
            <DialogDescription>Update target information</DialogDescription>
          </DialogHeader>
          {targetFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditTarget}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Target Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Target</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{deleteTarget?.pattern}&quot; from scope?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTarget}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Exclusion Dialog */}
      <Dialog open={isAddExclusionOpen} onOpenChange={(open) => {
        setIsAddExclusionOpen(open);
        if (!open) {
          resetExclusionForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Exclusion</DialogTitle>
            <DialogDescription>Add a pattern to exclude from scope</DialogDescription>
          </DialogHeader>
          {exclusionFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExclusionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExclusion}>Add Exclusion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Exclusion Dialog */}
      <Dialog open={!!editExclusion} onOpenChange={(open) => {
        if (!open) {
          setEditExclusion(null);
          resetExclusionForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exclusion</DialogTitle>
            <DialogDescription>Update exclusion information</DialogDescription>
          </DialogHeader>
          {exclusionFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditExclusion(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditExclusion}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Exclusion Dialog */}
      <Dialog open={!!deleteExclusion} onOpenChange={(open) => !open && setDeleteExclusion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Exclusion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{deleteExclusion?.pattern}&quot; from exclusions?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteExclusion(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteExclusion}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Schedule Dialog */}
      <Dialog open={isAddScheduleOpen} onOpenChange={setIsAddScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Schedule</DialogTitle>
            <DialogDescription>Create a new scan schedule</DialogDescription>
          </DialogHeader>
          {scheduleFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSchedule}>Create Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={!!editSchedule} onOpenChange={(open) => !open && setEditSchedule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>Update schedule configuration</DialogDescription>
          </DialogHeader>
          {scheduleFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSchedule(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSchedule}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Schedule Dialog */}
      <Dialog open={!!deleteSchedule} onOpenChange={(open) => !open && setDeleteSchedule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteSchedule?.name}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSchedule(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSchedule}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
