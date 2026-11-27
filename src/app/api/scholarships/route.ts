import { NextResponse } from "next/server";
import { fetchAllScholarships } from "@/lib/scholarships/providers/aggregator";

export async function GET() {
  const result = await fetchAllScholarships();
  return NextResponse.json(result);
}
