import { Opportunity } from "@/types";
import { DemoCompetitionProvider } from "./providers/demoCompetitions";
import { DevpostCompetitionProvider } from "./providers/devpost";
import { OfficialIndianCompetitionProvider } from "./providers/officialDirectories";
import { CompetitionProviderResult, CompetitionSearchParams } from "./types";

export interface CompetitionProviderStatus {
  id: string;
  name: string;
  ok: boolean;
  isLive: boolean;
  isDemo: boolean;
  count: number;
  totalCount: number;
  cached: boolean;
  fetchedAt: string;
  rateLimited?: boolean;
  error?: string;
}

export interface AggregatedCompetitionsResponse {
  ok: boolean;
  isLive: boolean;
  isDemo: boolean;
  opportunities: Opportunity[];
  providers: CompetitionProviderStatus[];
  totalLiveCount: number;
  fetchedAt: string;
  page: number;
}

function deduplicateCompetitions(items: Opportunity[]): Opportunity[] {
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

export async function fetchAllCompetitions(
  params: CompetitionSearchParams
): Promise<AggregatedCompetitionsResponse> {
  const settled = await Promise.allSettled([
    DevpostCompetitionProvider.searchCompetitions(params),
    OfficialIndianCompetitionProvider.searchCompetitions(params),
    DemoCompetitionProvider.searchCompetitions(params),
  ]);

  const providers: CompetitionProviderStatus[] = [];
  const collected: Opportunity[] = [];

  const fallbacks = [
    { id: "devpost", name: "Devpost", isLive: true, isDemo: false },
    { id: "official-competitions", name: "Official Directories", isLive: false, isDemo: false },
    { id: "demo-competitions", name: "Demo Competitions", isLive: false, isDemo: true },
  ];

  settled.forEach((s, idx) => {
    const fb = fallbacks[idx];
    if (s.status === "fulfilled") {
      const r: CompetitionProviderResult = s.value;
      providers.push({
        id: r.providerId,
        name: r.providerName,
        ok: r.ok,
        isLive: r.isLive,
        isDemo: r.isDemo,
        count: r.opportunities.length,
        totalCount: r.totalCount,
        cached: r.cached,
        fetchedAt: r.fetchedAt,
        rateLimited: r.rateLimited,
        error: r.error,
      });
      if (r.ok) collected.push(...r.opportunities);
    } else {
      providers.push({
        id: fb.id,
        name: fb.name,
        ok: false,
        isLive: fb.isLive,
        isDemo: fb.isDemo,
        count: 0,
        totalCount: 0,
        cached: false,
        fetchedAt: new Date().toISOString(),
        error: `${fb.name} failed unexpectedly.`,
      });
    }
  });

  let filtered = deduplicateCompetitions(collected);

  if (params.category && params.category !== "all") {
    filtered = filtered.filter(
      (o) =>
        o.competitionSubCategory === params.category ||
        o.category === params.category
    );
  }

  if (params.mode && params.mode !== "all") {
    const m = params.mode.toLowerCase();
    filtered = filtered.filter((o) => {
      if (m === "online") return o.workMode === "Remote";
      if (m === "offline") return o.workMode === "On-site";
      if (m === "hybrid") return o.workMode === "Hybrid";
      return true;
    });
  }

  if (params.country === "IN") {
    filtered = filtered.filter(
      (o) =>
        o.indiaEligibility === "india_based" ||
        o.indiaEligibility === "accepts_india" ||
        o.indiaEligibility === "worldwide"
    );
  }

  const devpostStatus = providers.find((p) => p.id === "devpost");

  return {
    ok: providers.some((p) => p.ok),
    isLive: Boolean(devpostStatus?.ok && devpostStatus.isLive),
    isDemo: filtered.some((o) => o.isDemo),
    opportunities: filtered,
    providers,
    totalLiveCount: devpostStatus?.totalCount || 0,
    fetchedAt: devpostStatus?.fetchedAt || new Date().toISOString(),
    page: params.page || 1,
  };
}
