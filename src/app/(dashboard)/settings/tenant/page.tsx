"use client";

import { useState } from "react";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { PageHeader } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  Building,
  Globe,
  Shield,
  Users,
  Clock,
  Key,
  Copy,
  RefreshCw,
  Upload,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function TenantPage() {
  const [isSaving, setIsSaving] = useState(false);

  // Mock tenant data
  const [tenant, setTenant] = useState({
    name: "Rediver Security",
    slug: "rediver-security",
    description: "Enterprise security platform for Vietnamese businesses",
    logo: "",
    website: "https://rediver.io",
    industry: "technology",
    timezone: "Asia/Ho_Chi_Minh",
    language: "vi",
    apiKey: "rsec_live_xxxxxxxxxxxxxxxxxxxxxxxx",
    webhookUrl: "https://hooks.rediver.io/webhook/abc123",
    ssoEnabled: true,
    mfaRequired: true,
    ipWhitelist: "",
    sessionTimeout: 30,
    maxUsers: 50,
    currentUsers: 12,
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Tenant settings saved successfully");
    }, 1000);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(tenant.apiKey);
    toast.success("API key copied to clipboard");
  };

  const handleRegenerateApiKey = () => {
    toast.info("API key regenerated", {
      description: "Please update your integrations with the new key",
    });
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
        <PageHeader
          title="Tenant Settings"
          description="Manage your organization settings and configuration"
        >
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className={`mr-2 h-4 w-4 ${isSaving ? "animate-spin" : ""}`} />
            Save Changes
          </Button>
        </PageHeader>

        <Tabs defaultValue="general" className="mt-6">
          <TabsList>
            <TabsTrigger value="general">
              <Building className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="api">
              <Key className="mr-2 h-4 w-4" />
              API & Webhooks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-6">
            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Organization Information
                </CardTitle>
                <CardDescription>
                  Basic information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={tenant.logo} />
                    <AvatarFallback className="text-2xl bg-primary/10">
                      {tenant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Recommended: 200x200px, PNG or JPG
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      value={tenant.name}
                      onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md">
                        app.rediver.io/
                      </span>
                      <Input
                        id="slug"
                        value={tenant.slug}
                        onChange={(e) => setTenant({ ...tenant, slug: e.target.value })}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={tenant.description}
                    onChange={(e) => setTenant({ ...tenant, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={tenant.website}
                      onChange={(e) => setTenant({ ...tenant, website: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={tenant.industry}
                      onValueChange={(value) => setTenant({ ...tenant, industry: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="finance">Finance & Banking</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Localization
                </CardTitle>
                <CardDescription>
                  Language and timezone settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={tenant.timezone}
                      onValueChange={(value) => setTenant({ ...tenant, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Ho_Chi_Minh">Vietnam (GMT+7)</SelectItem>
                        <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Japan (GMT+9)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Default Language</Label>
                    <Select
                      value={tenant.language}
                      onValueChange={(value) => setTenant({ ...tenant, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">Tieng Viet</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usage
                </CardTitle>
                <CardDescription>
                  Current usage and limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Users</p>
                    <p className="text-2xl font-bold">
                      {tenant.currentUsers} / {tenant.maxUsers}
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${(tenant.currentUsers / tenant.maxUsers) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Assets</p>
                    <p className="text-2xl font-bold">303 / 500</p>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: "60.6%" }} />
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Scans / month</p>
                    <p className="text-2xl font-bold">847 / 1000</p>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: "84.7%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4 space-y-6">
            {/* Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication
                </CardTitle>
                <CardDescription>
                  Configure authentication and access settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Single Sign-On (SSO)</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable SSO via SAML 2.0 or OIDC
                    </p>
                  </div>
                  <Switch
                    checked={tenant.ssoEnabled}
                    onCheckedChange={(checked) => setTenant({ ...tenant, ssoEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require MFA</Label>
                    <p className="text-sm text-muted-foreground">
                      All users must enable two-factor authentication
                    </p>
                  </div>
                  <Switch
                    checked={tenant.mfaRequired}
                    onCheckedChange={(checked) => setTenant({ ...tenant, mfaRequired: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="session-timeout" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Session Timeout (minutes)
                  </Label>
                  <Select
                    value={String(tenant.sessionTimeout)}
                    onValueChange={(value) => setTenant({ ...tenant, sessionTimeout: Number(value) })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* IP Restrictions */}
            <Card>
              <CardHeader>
                <CardTitle>IP Restrictions</CardTitle>
                <CardDescription>
                  Limit access to specific IP addresses or ranges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="ip-whitelist">Allowed IP Addresses</Label>
                  <Textarea
                    id="ip-whitelist"
                    placeholder="Enter IP addresses or CIDR ranges, one per line&#10;Example: 192.168.1.0/24"
                    value={tenant.ipWhitelist}
                    onChange={(e) => setTenant({ ...tenant, ipWhitelist: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to allow access from any IP address
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="mt-4 space-y-6">
            {/* API Key */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Key
                </CardTitle>
                <CardDescription>
                  Use this key to authenticate API requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tenant.apiKey}
                    readOnly
                    className="font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyApiKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleRegenerateApiKey}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep your API key secure. Do not share it publicly or commit it to version control.
                </p>
              </CardContent>
            </Card>

            {/* Webhook */}
            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>
                  Receive real-time notifications for events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://your-server.com/webhook"
                    value={tenant.webhookUrl}
                    onChange={(e) => setTenant({ ...tenant, webhookUrl: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Events to Send</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      "finding.created",
                      "finding.resolved",
                      "scan.completed",
                      "scan.failed",
                      "asset.discovered",
                      "task.completed",
                    ].map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <Switch defaultChecked id={event} />
                        <Label htmlFor={event} className="font-mono text-sm">
                          {event}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="outline" size="sm">
                  Test Webhook
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}
