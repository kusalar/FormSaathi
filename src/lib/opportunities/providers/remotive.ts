import { Opportunity } from "@/types";
import { classifyEngineeringDomain } from "./classify";
import {
  InternshipProvider,
  InternshipProviderResult,
  InternshipSearchParams,
} from "./types";

const REMOTIVE_API_URL = "https://remotive.com/api/remote-jobs";
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

interface RemotiveRawJob {
  id?: number;
  url?: string;
  title?: string;
  company_name?: string;
  company_logo?: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
}

interface RemotiveApiResponse {
  jobs?: RemotiveRawJob[];
}

const remotiveCache = new Map<
  string,
  { expiresAt: number; result: InternshipProviderResult }
>();

function stripHtmlSummary(html?: string): string {
  if (!html) return "Remote internship listing retrieved from Remotive.";
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > 220 ? `${plain.slice(0, 217)}...` : plain;
}

export function normalizeRemotiveJob(
  raw: RemotiveRawJob,
  fetchedAtIso: string
): Opportunity | null {
  if (!raw.title || !raw.url) return null;

  // Strict internship filter: never pollute with unrelated full-time roles
  const isInternType = raw.job_type?.toLowerCase() === "internship";
  const hasInternTitle = /\bintern(ship)?\b/i.test(raw.title);
  if (!isInternType && !hasInternTitle) return null;

  const loc = raw.candidate_required_location?.trim() || "";
  const locLower = loc.toLowerCase();
  const acceptsIndia =
    !loc ||
    locLower.includes("worldwide") ||
    locLower.includes("anywhere") ||
    locLower.includes("india") ||
    locLower.includes("apac");

  const combinedText = `${raw.title} ${raw.category || ""} ${(raw.tags || []).join(" ")}`;

  return {
    id: `rem-${raw.id || Buffer.from(raw.url).toString("base64url").slice(0, 16)}`,
    isDemo: false,
    title: raw.title.trim(),
    organisation: raw.company_name?.trim() || "Company not specified",
    category: "internship",
    description: stripHtmlSummary(raw.description),
    eligibilityCriteria:
      "Academic eligibility (degree, branch, year) is not specified by Remotive — verify on the original listing.",
    requiredDegrees: [],
    requiredBranches: [],
    eligibleYears: [],
    requiredSkills: (raw.tags || []).slice(0, 8),
    minGradYear: null,
    maxGradYear: null,
    minIncomeLakh: null,
    maxIncomeLakh: null,
    institutionTypes: [],
    location: loc || "Worldwide (Remote)",
    workMode: "Remote",
    stipendOrSalary: raw.salary?.trim() || "Compensation not specified",
    deadline: null,
    applicationUrl: raw.url,
    sourceName: "Remotive",
    sourceUrl: "https://remotive.com",
    datePublished: raw.publication_date ? raw.publication_date.slice(0, 10) : null,
    lastVerifiedAt: fetchedAtIso.slice(0, 10),
    lastFetchedAt: fetchedAtIso,
    status: "active",
    employmentType: raw.job_type || "internship",
    locationRestrictions: loc ? [loc] : [],
    hasAcademicCriteria: false,
    sourceBadge: "LIVE API",
    indiaEligibility: locLower.includes("india")
      ? "accepts_india"
      : acceptsIndia
      ? "worldwide"
      : "restricted_other",
    engineeringDomain: classifyEngineeringDomain(combinedText),
    applicationStatusLabel: "Unverified",
    companyLogo: raw.company_logo || null,
  };
}

export const RemotiveInternshipProvider: InternshipProvider = {
  id: "remotive",
  name: "Remotive",
  sourceUrl: "https://remotive.com",
  isLive: true,

  async searchInternships(
    params: InternshipSearchParams
  ): Promise<InternshipProviderResult> {
    const query = params.query?.trim() || "intern";
    const url = new URL(REMOTIVE_API_URL);
    url.searchParams.set("search", query.toLowerCase().includes("intern") ? query : `${query} intern`);

    const cacheKey = url.toString();
    const now = Date.now();
    if (!params.refresh) {
      const cached = remotiveCache.get(cacheKey);
      if (cached && cached.expiresAt > now) {
        return { ...cached.result, cached: true };
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });

      if (res.status === 429) {
        return {
          ok: false,
          providerId: "remotive",
          providerName: "Remotive",
          providerUrl: "https://remotive.com",
          isLive: false,
          fetchedAt: new Date(now).toISOString(),
          totalCount: 0,
          page: 1,
          opportunities: [],
          cached: false,
          rateLimited: true,
          error: "Remotive API rate limit reached (HTTP 429).",
        };
      }

      if (!res.ok) {
        return {
          ok: false,
          providerId: "remotive",
          providerName: "Remotive",
          providerUrl: "https://remotive.com",
          isLive: false,
          fetchedAt: new Date(now).toISOString(),
          totalCount: 0,
          page: 1,
          opportunities: [],
          cached: false,
          error: `Remotive API returned HTTP ${res.status}.`,
        };
      }

      const data = (await res.json()) as RemotiveApiResponse;
      const fetchedAt = new Date(now).toISOString();
      const normalized = (data.jobs || [])
        .map((j) => normalizeRemotiveJob(j, fetchedAt))
        .filter((o): o is Opportunity => o !== null);

      const result: InternshipProviderResult = {
        ok: true,
        providerId: "remotive",
        providerName: "Remotive",
        providerUrl: "https://remotive.com",
        isLive: true,
        fetchedAt,
        totalCount: normalized.length,
        page: 1,
        opportunities: normalized,
        cached: false,
      };

      remotiveCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, result });
      return result;
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      return {
        ok: false,
        providerId: "remotive",
        providerName: "Remotive",
        providerUrl: "https://remotive.com",
        isLive: false,
        fetchedAt: new Date(now).toISOString(),
        totalCount: 0,
        page: 1,
        opportunities: [],
        cached: false,
        error: isAbort
          ? "Request to Remotive timed out."
          : "Could not reach Remotive service.",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
