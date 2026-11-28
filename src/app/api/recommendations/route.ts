import { NextRequest, NextResponse } from "next/server";
import { fetchUnifiedOpportunities } from "@/lib/opportunities/unified/aggregate";

export async function GET(request: NextRequest) {
  try {
    const refresh =
      request.nextUrl.searchParams.get("refresh") === "1" ||
      request.nextUrl.searchParams.get("refresh") === "true";

    const data = await fetchUnifiedOpportunities({ refresh });

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to aggregate recommendations",
        items: [],
        providers: [],
        partialFailures: ["Unexpected server error"],
      },
      { status: 500 }
    );
  }
}
