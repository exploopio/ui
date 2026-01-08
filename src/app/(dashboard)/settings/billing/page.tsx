"use client";

import { useState } from "react";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { PageHeader } from "@/features/shared";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Download,
  FileText,
  Check,
  Zap,
  BarChart3,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Mock data
const currentPlan = {
  name: "Enterprise",
  price: 999,
  currency: "USD",
  billingCycle: "monthly",
  status: "active",
  nextBillingDate: "2025-02-08",
  features: [
    { name: "Users", limit: 50, used: 12 },
    { name: "Assets", limit: 500, used: 303 },
    { name: "Scans/month", limit: 1000, used: 847 },
    { name: "Storage", limit: "100GB", used: "45GB" },
    { name: "API calls/day", limit: 50000, used: 23456 },
  ],
};

const invoices = [
  { id: "INV-2025-001", date: "2025-01-08", amount: 999, status: "paid" },
  { id: "INV-2024-012", date: "2024-12-08", amount: 999, status: "paid" },
  { id: "INV-2024-011", date: "2024-11-08", amount: 999, status: "paid" },
  { id: "INV-2024-010", date: "2024-10-08", amount: 999, status: "paid" },
  { id: "INV-2024-009", date: "2024-09-08", amount: 999, status: "paid" },
];

const plans = [
  {
    name: "Starter",
    price: 99,
    description: "For small teams getting started",
    features: ["10 Users", "50 Assets", "100 Scans/month", "Email support"],
    highlighted: false,
  },
  {
    name: "Professional",
    price: 299,
    description: "For growing security teams",
    features: ["25 Users", "200 Assets", "500 Scans/month", "Priority support", "API access"],
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: 999,
    description: "For large organizations",
    features: ["50 Users", "500 Assets", "1000 Scans/month", "24/7 support", "API access", "SSO", "Custom integrations"],
    highlighted: true,
    current: true,
  },
];

const paymentMethod = {
  type: "card",
  brand: "Visa",
  last4: "4242",
  expiry: "12/26",
};

export default function BillingPage() {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleDownloadInvoice = (invoiceId: string) => {
    setIsDownloading(invoiceId);
    setTimeout(() => {
      setIsDownloading(null);
      toast.success("Invoice downloaded", { description: invoiceId });
    }, 1000);
  };

  const handleUpdatePayment = () => {
    toast.info("Redirecting to payment portal...");
  };

  const handleChangePlan = (planName: string) => {
    toast.info(`Contact sales to change to ${planName} plan`);
  };

  const getUsagePercentage = (used: number | string, limit: number | string) => {
    if (typeof used === "string" || typeof limit === "string") {
      const usedNum = parseInt(used.toString());
      const limitNum = parseInt(limit.toString());
      return (usedNum / limitNum) * 100;
    }
    return (used / limit) * 100;
  };

  return (
    <>
      <Header fixed>
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <PageHeader
          title="Billing"
          description="Manage your subscription and billing information"
        >
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
                    {currentPlan.name} Plan
                  </CardTitle>
                  <CardDescription>
                    Your current subscription
                  </CardDescription>
                </div>
                <Badge className="bg-green-500">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">${currentPlan.price}</span>
                <span className="text-muted-foreground">/{currentPlan.billingCycle}</span>
              </div>

              <Separator />

              {/* Usage */}
              <div className="space-y-4">
                <h4 className="font-medium">Usage this billing period</h4>
                {currentPlan.features.map((feature) => {
                  const percentage = getUsagePercentage(feature.used, feature.limit);
                  const isHigh = percentage > 80;
                  return (
                    <div key={feature.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{feature.name}</span>
                        <span className={isHigh ? "text-orange-500 font-medium" : ""}>
                          {feature.used} / {feature.limit}
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className={`h-2 ${isHigh ? "[&>div]:bg-orange-500" : ""}`}
                      />
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next billing date</span>
                <span className="font-medium">
                  {new Date(currentPlan.nextBillingDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
            </CardFooter>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
              <CardDescription>
                Your default payment method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                    <CreditCard className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {paymentMethod.brand} ending in {paymentMethod.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires {paymentMethod.expiry}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={handleUpdatePayment}>
                Update Card
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Available Plans */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Choose the plan that best fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-lg border p-6 ${
                    plan.highlighted ? "border-primary ring-2 ring-primary" : ""
                  }`}
                >
                  {plan.current && (
                    <Badge className="absolute -top-2 right-4 bg-primary">Current Plan</Badge>
                  )}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.current ? "outline" : "default"}
                      disabled={plan.current}
                      onClick={() => handleChangePlan(plan.name)}
                    >
                      {plan.current ? "Current Plan" : "Upgrade"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invoice History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice History
            </CardTitle>
            <CardDescription>
              Download your past invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>
                      {new Date(invoice.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        <Check className="mr-1 h-3 w-3" />
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        disabled={isDownloading === invoice.id}
                      >
                        <Download className={`mr-2 h-4 w-4 ${isDownloading === invoice.id ? "animate-bounce" : ""}`} />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Usage Alerts */}
        <Card className="mt-6 border-orange-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <AlertCircle className="h-5 w-5" />
              Usage Alerts
            </CardTitle>
            <CardDescription>
              You are approaching your plan limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-orange-500/30 bg-orange-500/5 p-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Scans usage at 85%</p>
                    <p className="text-sm text-muted-foreground">
                      847 of 1000 scans used this month
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
