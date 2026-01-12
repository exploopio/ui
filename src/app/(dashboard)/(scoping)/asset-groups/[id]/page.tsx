"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { RiskScoreBadge } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  ArrowLeft,
  FolderKanban,
  Pencil,
  Trash2,
  Plus,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Globe,
  Server,
  Database,
  Cloud,
  GitBranch,
  AlertTriangle,
  Download,
  Search as SearchIcon,
  X,
  Link,
  Eye,
} from "lucide-react";
import {
  getAssetGroupById,
  getAssetsByGroupId,
  getFindingsByGroupId,
} from "@/features/asset-groups";

type Environment = "production" | "staging" | "development" | "testing";
type Criticality = "critical" | "high" | "medium" | "low";

const criticalityColors: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-blue-500 text-white",
};

const environmentColors: Record<string, string> = {
  production: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  staging: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  development: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  testing: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  info: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

const assetTypeIcons: Record<string, React.ReactNode> = {
  domain: <Globe className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
  api: <Server className="h-4 w-4" />,
  host: <Server className="h-4 w-4" />,
  cloud: <Cloud className="h-4 w-4" />,
  project: <GitBranch className="h-4 w-4" />,
  repository: <GitBranch className="h-4 w-4" />, // @deprecated
  database: <Database className="h-4 w-4" />,
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AssetGroupDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Data - must be called before any early returns
  const group = getAssetGroupById(id);
  const assets = useMemo(() => getAssetsByGroupId(id), [id]);
  const findings = useMemo(() => getFindingsByGroupId(id), [id]);

  // UI State - must be called before any early returns
  const [activeTab, setActiveTab] = useState("overview");
  const [assetSearch, setAssetSearch] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  // Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [removeAssetsDialogOpen, setRemoveAssetsDialogOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: group?.name || "",
    description: group?.description || "",
    environment: (group?.environment || "production") as Environment,
    criticality: (group?.criticality || "medium") as Criticality,
  });

  // All useMemo hooks must be called before early return
  const filteredAssets = useMemo(() => {
    if (!assetSearch) return assets;
    return assets.filter((a) =>
      a.name.toLowerCase().includes(assetSearch.toLowerCase())
    );
  }, [assets, assetSearch]);

  const assetsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, [assets]);

  const findingsBySeverity = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    findings.forEach((f) => {
      counts[f.severity] = (counts[f.severity] || 0) + 1;
    });
    return counts;
  }, [findings]);

  // Not found - early return after all hooks
  if (!group) {
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
          <div className="flex flex-col items-center justify-center py-20">
            <FolderKanban className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Group Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The asset group you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push("/asset-groups")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Button>
          </div>
        </Main>
      </>
    );
  }

  // Handlers
  const handleCopyId = () => {
    navigator.clipboard.writeText(group.id);
    toast.success("Group ID copied");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  const handleEdit = () => {
    setFormData({
      name: group.name,
      description: group.description || "",
      environment: group.environment as Environment,
      criticality: group.criticality as Criticality,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    toast.success("Group updated successfully");
    setEditDialogOpen(false);
  };

  const handleDelete = () => {
    toast.success("Group deleted successfully");
    setDeleteDialogOpen(false);
    router.push("/asset-groups");
  };

  const handleRemoveAssets = () => {
    toast.success(`Removed ${selectedAssets.length} assets from group`);
    setSelectedAssets([]);
    setRemoveAssetsDialogOpen(false);
  };

  const handleExport = (format: string) => {
    toast.success(`Exporting group as ${format}...`);
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const toggleAllAssets = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map((a) => a.id));
    }
  };

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
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/asset-groups")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  group.criticality === "critical"
                    ? "bg-red-500/20"
                    : group.criticality === "high"
                    ? "bg-orange-500/20"
                    : group.criticality === "medium"
                    ? "bg-yellow-500/20"
                    : "bg-blue-500/20"
                }`}
              >
                <FolderKanban
                  className={`h-6 w-6 ${
                    group.criticality === "critical"
                      ? "text-red-500"
                      : group.criticality === "high"
                      ? "text-orange-500"
                      : group.criticality === "medium"
                      ? "text-yellow-500"
                      : "text-blue-500"
                  }`}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{group.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {group.description || "No description"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={environmentColors[group.environment]}>
              {group.environment}
            </Badge>
            <Badge className={criticalityColors[group.criticality]}>
              {group.criticality}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyId}>
              <Copy className="mr-2 h-4 w-4" />
              Copy ID
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Link className="mr-2 h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport("JSON")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("CSV")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Assets</CardDescription>
              <CardTitle className="text-3xl">{group.assetCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Findings</CardDescription>
              <CardTitle className="text-3xl text-orange-500">
                {group.findingCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Risk Score</CardDescription>
              <div className="pt-1">
                <RiskScoreBadge score={group.riskScore} size="lg" />
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Last Updated</CardDescription>
              <CardTitle className="text-lg">
                {new Date(group.updatedAt).toLocaleDateString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assets">
              Assets ({group.assetCount})
            </TabsTrigger>
            <TabsTrigger value="findings">
              Findings ({group.findingCount})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Asset Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Asset Distribution</CardTitle>
                  <CardDescription>Breakdown by asset type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(assetsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                          {assetTypeIcons[type] || <Server className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">{type}</span>
                            <span className="text-sm text-muted-foreground">{count}</span>
                          </div>
                          <Progress
                            value={(count / group.assetCount) * 100}
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Finding Severity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Finding Severity</CardTitle>
                  <CardDescription>Breakdown by severity level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(findingsBySeverity).map(([severity, count]) => (
                      <div key={severity} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={severityColors[severity]}>
                            {severity}
                          </Badge>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Assessment</CardTitle>
                  <CardDescription>Overall group risk score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <RiskScoreBadge score={group.riskScore} size="lg" />
                    <div className="flex-1">
                      <Progress
                        value={group.riskScore}
                        className={`h-3 ${
                          group.riskScore >= 80
                            ? "[&>div]:bg-red-500"
                            : group.riskScore >= 60
                            ? "[&>div]:bg-orange-500"
                            : group.riskScore >= 40
                            ? "[&>div]:bg-yellow-500"
                            : "[&>div]:bg-green-500"
                        }`}
                      />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                        <span>Critical</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Group Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Group Information</CardTitle>
                  <CardDescription>Metadata and details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Group ID</span>
                      <span className="font-mono">{group.id}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Updated</span>
                      <span>{new Date(group.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Environment</span>
                      <Badge variant="outline" className={environmentColors[group.environment]}>
                        {group.environment}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Criticality</span>
                      <Badge className={criticalityColors[group.criticality]}>
                        {group.criticality}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Assets</CardTitle>
                    <CardDescription>
                      {filteredAssets.length} assets in this group
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedAssets.length > 0 && (
                      <>
                        <span className="text-sm text-muted-foreground">
                          {selectedAssets.length} selected
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRemoveAssetsDialogOpen(true)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove from Group
                        </Button>
                      </>
                    )}
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Assets
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search assets..."
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              filteredAssets.length > 0 &&
                              selectedAssets.length === filteredAssets.length
                            }
                            onCheckedChange={toggleAllAssets}
                          />
                        </TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Risk Score</TableHead>
                        <TableHead>Findings</TableHead>
                        <TableHead>Last Seen</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedAssets.includes(asset.id)}
                              onCheckedChange={() => toggleAssetSelection(asset.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                {assetTypeIcons[asset.type]}
                              </div>
                              <span className="font-medium">{asset.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {asset.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                asset.status === "active"
                                  ? "text-green-500 border-green-500/30 bg-green-500/10"
                                  : asset.status === "monitoring"
                                  ? "text-blue-500 border-blue-500/30 bg-blue-500/10"
                                  : "text-gray-500 border-gray-500/30 bg-gray-500/10"
                              }
                            >
                              {asset.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <RiskScoreBadge score={asset.riskScore} size="sm" />
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                asset.findingCount > 0 ? "text-orange-500 font-medium" : ""
                              }
                            >
                              {asset.findingCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(asset.lastSeen).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Findings Tab */}
          <TabsContent value="findings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Findings</CardTitle>
                <CardDescription>
                  Security findings associated with this group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Finding</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Discovered</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {findings.map((finding) => (
                        <TableRow key={finding.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="font-medium">{finding.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={severityColors[finding.severity]}>
                              {finding.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                finding.status === "resolved"
                                  ? "text-green-500 border-green-500/30 bg-green-500/10"
                                  : finding.status === "in_progress"
                                  ? "text-blue-500 border-blue-500/30 bg-blue-500/10"
                                  : "text-orange-500 border-orange-500/30 bg-orange-500/10"
                              }
                            >
                              {finding.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {finding.assetName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(finding.discoveredAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset Group</DialogTitle>
            <DialogDescription>Update the group details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Environment</Label>
                <Select
                  value={formData.environment}
                  onValueChange={(value: Environment) =>
                    setFormData({ ...formData, environment: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Criticality</Label>
                <Select
                  value={formData.criticality}
                  onValueChange={(value: Criticality) =>
                    setFormData({ ...formData, criticality: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!formData.name}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{group.name}&quot;? This action
              cannot be undone. All {group.assetCount} assets will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Assets Dialog */}
      <AlertDialog open={removeAssetsDialogOpen} onOpenChange={setRemoveAssetsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Assets from Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedAssets.length} assets from this
              group? They will become ungrouped assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAssets}>
              Remove Assets
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
