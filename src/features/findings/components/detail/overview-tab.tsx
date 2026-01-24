"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, FileText, AlertTriangle, Info, Shield, FolderCode, Scan } from "lucide-react";
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

          <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
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

      {/* Location Info - Only show if file path exists */}
      {finding.filePath && (
        <>
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <FolderCode className="h-4 w-4" />
              Location
            </h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                <div className="sm:col-span-2 md:col-span-3">
                  <p className="text-muted-foreground text-xs mb-1">File Path</p>
                  <p className="font-mono text-sm break-all">{finding.filePath}</p>
                </div>
                {finding.startLine && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Line</p>
                    <p className="font-mono text-sm">
                      {finding.startLine}
                      {finding.endLine && finding.endLine !== finding.startLine && (
                        <span className="text-muted-foreground"> - {finding.endLine}</span>
                      )}
                    </p>
                  </div>
                )}
                {finding.startColumn && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Column</p>
                    <p className="font-mono text-sm">
                      {finding.startColumn}
                      {finding.endColumn && finding.endColumn !== finding.startColumn && (
                        <span className="text-muted-foreground"> - {finding.endColumn}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Code Snippet - Only show if snippet exists */}
      {finding.snippet && (
        <>
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <FileText className="h-4 w-4" />
              Code Snippet
            </h3>
            <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap break-all">
              {finding.snippet}
            </pre>
          </div>
          <Separator />
        </>
      )}

      {/* Scanner Info - Always show for context */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <Scan className="h-4 w-4" />
          Scanner Details
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
          {finding.toolName && (
            <div>
              <p className="text-muted-foreground text-xs">Scanner</p>
              <p className="font-medium">
                {finding.toolName}
                {finding.toolVersion && (
                  <span className="text-muted-foreground ml-1 text-xs">v{finding.toolVersion}</span>
                )}
              </p>
            </div>
          )}
          {finding.ruleId && (
            <div>
              <p className="text-muted-foreground text-xs">Rule ID</p>
              <p className="font-mono text-sm">{finding.ruleId}</p>
            </div>
          )}
          {finding.ruleName && (
            <div>
              <p className="text-muted-foreground text-xs">Rule Name</p>
              <p className="text-sm">{finding.ruleName}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-xs">Source Type</p>
            <Badge variant="outline" className="mt-1 capitalize">
              {finding.source}
            </Badge>
          </div>
        </div>
      </div>

      {/* Technical Details - CVE/CWE/CVSS (only show section if any values exist) */}
      {(finding.cvss !== undefined || finding.cvssVector || finding.cve || finding.cwe || finding.owasp) && (
        <>
          <Separator />
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Shield className="h-4 w-4" />
              Vulnerability Classification
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
              {finding.cvss !== undefined && (
                <div>
                  <p className="text-muted-foreground text-xs">CVSS Score</p>
                  <p className="font-mono font-medium">{finding.cvss}</p>
                </div>
              )}
              {finding.cvssVector && (
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground text-xs">CVSS Vector</p>
                  <p className="font-mono text-xs sm:text-sm break-all">{finding.cvssVector}</p>
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
        </>
      )}

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
