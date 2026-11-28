import { UnifiedDataSourceType, UnifiedOpportunity } from "./types";

const SOURCE_TRUST_PRIORITY: Record<UnifiedDataSourceType, number> = {
  "OFFICIAL SOURCE": 7,
  "LIVE API": 6,
  "OFFICIAL DIRECTORY": 5,
  "VERIFIED INFORMATION": 4,
  CURATED: 3,
  "NEEDS VERIFICATION": 2,
  DEMO: 1,
};

function canonicalizeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const paramsToStrip = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "ref",
    ];
    for (const p of paramsToStrip) {
      parsed.searchParams.delete(p);
    }
    const cleanPath = parsed.pathname.replace(/\/+$/, "");
    const search = parsed.searchParams.toString();
    return `${parsed.hostname.toLowerCase()}${cleanPath.toLowerCase()}${search ? `?${search}` : ""}`;
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, "");
  }
}

function canonicalTitleOrgKey(item: UnifiedOpportunity): string {
  const title = item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const org = item.organisation
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return `${title}::${org}`;
}

function richnessScore(item: UnifiedOpportunity): number {
  let score = SOURCE_TRUST_PRIORITY[item.dataSourceType] * 100;
  if (!item.isDemo) score += 200;
  if (item.applicationUrl) score += 20;
  if (item.deadline) score += 15;
  if (item.description.length > 80) score += 10;
  if (item.requiredSkills.length > 0) score += 8;
  if (item.requiredBranches.length > 0) score += 5;
  return score;
}

/**
 * Deduplicates unified opportunities across providers by:
 * 1) canonical applicationUrl (when present and not a shared directory root unless title+org match)
 * 2) normalized title + organisation
 * Always preserves the richer / higher-trust / non-demo record.
 */
export function deduplicateUnifiedOpportunities(
  items: UnifiedOpportunity[]
): { items: UnifiedOpportunity[]; removedCount: number } {
  const byTitleOrg = new Map<string, UnifiedOpportunity>();
  const byUrl = new Map<string, string>(); // canonicalUrl -> titleOrgKey
  let removedCount = 0;

  for (const item of items) {
    const titleOrgKey = canonicalTitleOrgKey(item);
    const urlKey = canonicalizeUrl(item.applicationUrl);

    // Check title+org collision first
    const existingByTitle = byTitleOrg.get(titleOrgKey);
    if (existingByTitle) {
      removedCount += 1;
      if (richnessScore(item) > richnessScore(existingByTitle)) {
        byTitleOrg.set(titleOrgKey, item);
        if (urlKey) byUrl.set(urlKey, titleOrgKey);
      }
      continue;
    }

    // Check exact URL collision only if URL has a specific path (avoid collapsing distinct listings on a portal homepage)
    if (urlKey) {
      const pathPart = urlKey.split("/").slice(1).join("/");
      const isSpecificUrl = pathPart.length > 3;
      const existingKeyForUrl = isSpecificUrl ? byUrl.get(urlKey) : undefined;
      if (existingKeyForUrl) {
        const existingItem = byTitleOrg.get(existingKeyForUrl);
        if (existingItem && existingItem.category === item.category) {
          removedCount += 1;
          if (richnessScore(item) > richnessScore(existingItem)) {
            byTitleOrg.delete(existingKeyForUrl);
            byTitleOrg.set(titleOrgKey, item);
            byUrl.set(urlKey, titleOrgKey);
          }
          continue;
        }
      }
      if (isSpecificUrl) {
        byUrl.set(urlKey, titleOrgKey);
      }
    }

    byTitleOrg.set(titleOrgKey, item);
  }

  return {
    items: Array.from(byTitleOrg.values()),
    removedCount,
  };
}
