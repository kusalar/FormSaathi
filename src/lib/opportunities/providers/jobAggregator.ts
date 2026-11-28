import { Opportunity } from "@/types";
import { HimalayasJobProvider } from "./himalayasJobs";
import { OFFICIAL_INDIAN_JOB_SOURCES } from "./indianOfficialJobs";
import { RemotiveJobProvider } from "./remotiveJobs";
import { ProviderStatusSummary } from "./aggregator";
import { InternshipProviderResult, InternshipSearchParams } from "./types";

export interface AggregatedJobsResult {
  ok: boolean;
  opportunities: Opportunity[];
  providers: ProviderStatusSummary[];
  totalLiveCount: number;
  fetchedAt: string;
  page: number;
}

function deduplicateJobs(items: Opportunity[]): Opportunity[] {
  const seenUrls = new Set<string>();
  const seenTitleOrg = new Set<string>();
  const out: Opportunity[] = [];

  for (const item of items) {
    const urlKey = (item.applicationUrl || item.id).trim().toLowerCase();
    const titleOrgKey = `${item.title.trim().toLowerCase()}::${item.organisation
      .trim()
      .toLowerCase()}`;
    if (seenUrls.has(urlKey) || seenTitleOrg.has(titleOrgKey)) continue;
    seenUrls.add(urlKey);
    seenTitleOrg.add(titleOrgKey);
    out.push(item);
  }
  return out;
}

export async function fetchAllJobs(
  params: InternshipSearchParams
): Promise<AggregatedJobsResult> {
  const [himSettled, remSettled] = await Promise.allSettled([
    HimalayasJobProvider.searchInternships(params),
    RemotiveJobProvider.searchInternships(params),
  ]);

  const toResult = (
    settled: PromiseSettledResult<InternshipProviderResult>,
    fallbackId: string,
    fallbackName: string
  ): InternshipProviderResult => {
    if (settled.status === "fulfilled") return settled.value;
    return {
      ok: false,
      providerId: fallbackId,
      providerName: fallbackName,
      providerUrl: "",
      isLive: false,
      fetchedAt: new Date().toISOString(),
      totalCount: 0,
      page: params.page || 1,
      opportunities: [],
      cached: false,
      error: `${fallbackName} failed unexpectedly.`,
    };
  };

  const him = toResult(himSettled, "himalayas-jobs", "Himalayas Jobs");
  const rem = toResult(remSettled, "remotive-jobs", "Remotive Jobs");

  const liveJobs = deduplicateJobs([...him.opportunities, ...rem.opportunities]);
  const combined = deduplicateJobs([...liveJobs, ...OFFICIAL_INDIAN_JOB_SOURCES]);

  const providers: ProviderStatusSummary[] = [
    {
      id: him.providerId,
      name: him.providerName,
      ok: him.ok,
      isLive: him.isLive,
      count: him.opportunities.length,
      totalCount: him.totalCount,
      cached: him.cached,
      fetchedAt: him.fetchedAt,
      rateLimited: him.rateLimited,
      error: him.error,
    },
    {
      id: rem.providerId,
      name: rem.providerName,
      ok: rem.ok,
      isLive: rem.isLive,
      count: rem.opportunities.length,
      totalCount: rem.totalCount,
      cached: rem.cached,
      fetchedAt: rem.fetchedAt,
      rateLimited: rem.rateLimited,
      error: rem.error,
    },
    {
      id: "official-indian-jobs",
      name: "Official Indian Career Portals",
      ok: true,
      isLive: false,
      count: OFFICIAL_INDIAN_JOB_SOURCES.length,
      totalCount: OFFICIAL_INDIAN_JOB_SOURCES.length,
      cached: true,
      fetchedAt: OFFICIAL_INDIAN_JOB_SOURCES[0]?.lastVerifiedAt || "",
    },
  ];

  return {
    ok: him.ok || rem.ok,
    opportunities: combined,
    providers,
    totalLiveCount: him.totalCount + rem.totalCount,
    fetchedAt: him.ok ? him.fetchedAt : rem.fetchedAt,
    page: params.page || 1,
  };
}
