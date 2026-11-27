import { NextResponse } from "next/server";
import { fetchAllInternships } from "@/lib/opportunities/providers/aggregator";
import { getLastSuccessfulHimalayasFetch } from "@/lib/opportunities/providers/himalayas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const rawCountry = searchParams.get("country") ?? "IN";
  const country = rawCountry.toLowerCase() === "all" ? "" : rawCountry;
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const refresh = searchParams.get("refresh") === "1";

  const aggregated = await fetchAllInternships({
    query,
    country,
    page,
    refresh,
  });

  const liveProvidersOk = aggregated.providers.some(
    (p) => (p.id === "himalayas" || p.id === "remotive") && p.ok
  );

  return NextResponse.json({
    ok: aggregated.ok,
    isLive: liveProvidersOk,
    providerName: "Multi-Provider (Himalayas + Remotive + Official Indian Portals)",
    fetchedAt: aggregated.fetchedAt,
    lastSuccessfulFetchAt: getLastSuccessfulHimalayasFetch() || aggregated.fetchedAt,
    totalCount: aggregated.totalLiveCount,
    page: aggregated.page,
    providers: aggregated.providers,
    opportunities: aggregated.opportunities,
  });
}
