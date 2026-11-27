import { NextResponse } from "next/server";
import {
  getLastSuccessfulHimalayasFetch,
  HimalayasInternshipProvider,
} from "@/lib/opportunities/providers/himalayas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const rawCountry = searchParams.get("country") ?? "IN";
  const country = rawCountry.toLowerCase() === "all" ? "" : rawCountry;
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const refresh = searchParams.get("refresh") === "1";

  const result = await HimalayasInternshipProvider.searchInternships({
    query,
    country,
    page,
    refresh,
  });

  if (!result.ok) {
    const status = result.rateLimited ? 429 : 503;
    return NextResponse.json(
      {
        ...result,
        lastSuccessfulFetchAt: getLastSuccessfulHimalayasFetch(),
      },
      { status }
    );
  }

  return NextResponse.json({
    ...result,
    lastSuccessfulFetchAt: result.fetchedAt,
  });
}
