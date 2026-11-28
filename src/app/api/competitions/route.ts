import { NextResponse } from "next/server";
import { fetchAllCompetitions } from "@/lib/opportunities/competitions/aggregator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "all";
  const country = searchParams.get("country") || "all";
  const mode = searchParams.get("mode") || "all";
  const query = searchParams.get("q") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const refresh = searchParams.get("refresh") === "1";

  const result = await fetchAllCompetitions({
    category,
    country,
    mode,
    query,
    page,
    refresh,
  });

  return NextResponse.json(result);
}
