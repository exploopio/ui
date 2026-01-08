"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, FileText, AlertTriangle, Info, Shield } from "lucide-react";
import type { FindingDetail } from "../../types";
import { SEVERITY_CONFIG } from "../../types";

interface OverviewTabProps {
  finding: FindingDetail;
}

export function OverviewTab({ finding }: OverviewTabProps) {
  // Parse AI Triage if exists
  const aiTriageActivity = finding.activities.find((a) => a.type === "ai_triage");
  let aiTriage = null;
  if (aiTriageActivity && typeof aiTriageActivity.content === "string") {
    try {
      aiTriage = JSON.parse(aiTriageActivity.content);
    } catch {
      // ignore parse errors
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Triage Summary */}
      {aiTriage && (
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-500/20">
              <Info className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="font-semibold">AI Triage Analysis</h3>
          </div>

          <p className="text-muted-foreground mb-4 text-sm">{aiTriage.summary}</p>

          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-xs">Risk Level</p>
              <p
                className={`font-medium capitalize ${SEVERITY_CONFIG[aiTriage.risk as keyof typeof SEVERITY_CONFIG]?.textColor || ""}`}
              >
                {aiTriage.risk}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">CVSS Score</p>
              <p className="font-medium">{aiTriage.cvss}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Exploitability</p>
              <p className="font-medium capitalize">{aiTriage.exploitability}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Affected Assets</p>
              <p className="font-medium">{aiTriage.affectedAssets}</p>
            </div>
          </div>

          {aiTriage.recommendations && aiTriage.recommendations.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs">
                AI Recommendations
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {aiTriage.recommendations.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <FileText className="h-4 w-4" />
          Description
        </h3>
        <p className="text-muted-foreground whitespace-pre-wrap text-sm">
          {finding.description}
        </p>
      </div>

      <Separator />

      {/* Technical Details */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <Shield className="h-4 w-4" />
          Technical Details
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {finding.cvss !== undefined && (
            <div>
              <p className="text-muted-foreground text-xs">CVSS Score</p>
              <p className="font-mono font-medium">{finding.cvss}</p>
            </div>
          )}
          {finding.cvssVector && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">CVSS Vector</p>
              <p className="font-mono text-sm">{finding.cvssVector}</p>
            </div>
          )}
          {finding.cve && (
            <div>
              <p className="text-muted-foreground text-xs">CVE ID</p>
              <a
                href={`https://nvd.nist.gov/vuln/detail/${finding.cve}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-sm text-blue-400 hover:underline"
              >
                {finding.cve}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {finding.cwe && (
            <div>
              <p className="text-muted-foreground text-xs">CWE ID</p>
              <a
                href={`https://cwe.mitre.org/data/definitions/${finding.cwe.replace("CWE-", "")}.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-sm text-blue-400 hover:underline"
              >
                {finding.cwe}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {finding.owasp && (
            <div>
              <p className="text-muted-foreground text-xs">OWASP</p>
              <p className="font-mono text-sm">{finding.owasp}</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Affected Assets */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          Affected Assets ({finding.assets.length})
        </h3>
        <div className="space-y-2">
          {finding.assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="capitalize">
                  {asset.type}
                </Badge>
                <div>
                  <p className="font-medium">{asset.name}</p>
                  {asset.url && (
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
                    >
                      {asset.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              {asset.criticality && (
                <Badge
                  className={`${SEVERITY_CONFIG[asset.criticality].bgColor} ${SEVERITY_CONFIG[asset.criticality].textColor} border-0`}
                >
                  {asset.criticality}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
