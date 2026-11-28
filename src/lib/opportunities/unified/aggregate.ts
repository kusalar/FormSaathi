import { fetchAllCompetitions } from "@/lib/opportunities/competitions/aggregator";
import { fetchAllInternships } from "@/lib/opportunities/providers/aggregator";
import { fetchAllJobs } from "@/lib/opportunities/providers/jobAggregator";
import { fetchAllScholarships } from "@/lib/scholarships/providers/aggregator";
import { deduplicateUnifiedOpportunities } from "./deduplicate";
import {
  normalizeOpportunityToUnified,
  normalizeScholarshipToUnified,
} from "./normalize";
import {
  UnifiedCategoryCounts,
  UnifiedOpportunity,
  UnifiedProviderStatus,
  UnifiedRecommendationsResponse,
} from "./types";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedResponse: UnifiedRecommendationsResponse | null = null;
let cachedAtMs = 0;

function computeCategoryCounts(
  items: UnifiedOpportunity[]
): UnifiedCategoryCounts {
  const counts: UnifiedCategoryCounts = {
    all: items.length,
    scholarship: 0,
    internship: 0,
    job: 0,
    hackathon: 0,
    competition: 0,
    ambassador: 0,
    fellowship: 0,
    research: 0,
  };

  for (const item of items) {
    counts[item.category] += 1;
  }

  return counts;
}

export async function fetchUnifiedOpportunities(options?: {
  refresh?: boolean;
}): Promise<UnifiedRecommendationsResponse> {
  const refresh = Boolean(options?.refresh);
  const nowMs = Date.now();

  if (!refresh && cachedResponse && nowMs - cachedAtMs < CACHE_TTL_MS) {
    return cachedResponse;
  }

  const todayIso = new Date(nowMs).toISOString().slice(0, 10);
  const fetchedAt = new Date(nowMs).toISOString();

  const [schResult, intResult, jobResult, compResult] =
    await Promise.allSettled([
      fetchAllScholarships(),
      fetchAllInternships({ query: "", page: 1, refresh }),
      fetchAllJobs({ query: "", page: 1, refresh }),
      fetchAllCompetitions({ country: "all", mode: "all", page: 1, refresh }),
    ]);

  const rawItems: UnifiedOpportunity[] = [];
  const providers: UnifiedProviderStatus[] = [];
  const partialFailures: string[] = [];

  // 1. Scholarships
  if (schResult.status === "fulfilled") {
    for (const sch of schResult.value.scholarships) {
      rawItems.push(normalizeScholarshipToUnified(sch));
    }
    for (const p of schResult.value.providers) {
      providers.push({
        providerId: p.id,
        providerName: p.name,
        categoryGroup: "scholarships",
        ok: p.ok,
        isLive: p.dataSourceType === "LIVE API",
        isDemo: p.id.includes("demo") || p.dataSourceType === "DEMO",
        count: p.count,
        error: p.error,
      });
    }
  } else {
    partialFailures.push(
      `Scholarships provider failed: ${String(schResult.reason)}`
    );
  }

  // 2. Internships
  if (intResult.status === "fulfilled") {
    for (const opp of intResult.value.opportunities) {
      rawItems.push(normalizeOpportunityToUnified(opp));
    }
    for (const p of intResult.value.providers) {
      providers.push({
        providerId: p.id,
        providerName: p.name,
        categoryGroup: "internships",
        ok: p.ok,
        isLive: p.isLive,
        isDemo: p.id.includes("demo"),
        count: p.count,
        cached: p.cached,
        error: p.error,
      });
    }
  } else {
    partialFailures.push(
      `Internships provider failed: ${String(intResult.reason)}`
    );
  }

  // 3. Jobs
  if (jobResult.status === "fulfilled") {
    for (const opp of jobResult.value.opportunities) {
      rawItems.push(normalizeOpportunityToUnified(opp));
    }
    for (const p of jobResult.value.providers) {
      providers.push({
        providerId: p.id,
        providerName: p.name,
        categoryGroup: "jobs",
        ok: p.ok,
        isLive: p.isLive,
        isDemo: p.id.includes("demo"),
        count: p.count,
        cached: p.cached,
        error: p.error,
      });
    }
  } else {
    partialFailures.push(`Jobs provider failed: ${String(jobResult.reason)}`);
  }

  // 4. Hackathons, Competitions & Student Ambassadors
  if (compResult.status === "fulfilled") {
    for (const opp of compResult.value.opportunities) {
      rawItems.push(normalizeOpportunityToUnified(opp));
    }
    for (const p of compResult.value.providers) {
      providers.push({
        providerId: p.id,
        providerName: p.name,
        categoryGroup: "competitions",
        ok: p.ok,
        isLive: p.isLive,
        isDemo: p.isDemo,
        count: p.count,
        cached: p.cached,
        error: p.error,
      });
    }
  } else {
    partialFailures.push(
      `Competitions provider failed: ${String(compResult.reason)}`
    );
  }

  const { items: deduplicated, removedCount } =
    deduplicateUnifiedOpportunities(rawItems);

  const response: UnifiedRecommendationsResponse = {
    ok: deduplicated.length > 0,
    fetchedAt,
    todayIso,
    totalRawCount: rawItems.length,
    totalDeduplicatedCount: deduplicated.length,
    deduplicatedRemovedCount: removedCount,
    categoryCounts: computeCategoryCounts(deduplicated),
    providers,
    items: deduplicated,
    partialFailures,
  };

  cachedResponse = response;
  cachedAtMs = nowMs;

  return response;
}
