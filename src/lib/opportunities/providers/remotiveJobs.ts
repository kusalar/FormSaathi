import { Opportunity } from "@/types";
import { classifyEngineeringDomain } from "./classify";
import { classifyExperience, classifyJobCategoryGroup } from "./classifyJob";
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

const remotiveJobCache = new Map<
  string,
  { expiresAt: number; result: InternshipProviderResult }
>();

function stripHtml(html?: string): string {
  if (!html) return "Remote job listing retrieved from Remotive.";
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > 220 ? `${plain.slice(0, 217)}...` : plain;
}

export function normalizeRemotiveNonInternJob(
  raw: RemotiveRawJob,
  fetchedAtIso: string
): Opportunity | null {
  if (!raw.title || !raw.url) return null;
  if (raw.job_type?.toLowerCase() === "internship") return null;
  if (/\bintern(ship)?\b/i.test(raw.title)) return null;

  const loc = raw.candidate_required_location?.trim() || "";
  const locLower = loc.toLowerCase();
  const acceptsIndia =
    !loc ||
    locLower.includes("worldwide") ||
    locLower.includes("anywhere") ||
    locLower.includes("india") ||
    locLower.includes("apac");

  const desc = stripHtml(raw.description);
  const combined = `${raw.title} ${raw.category || ""} ${(raw.tags || []).join(" ")} ${desc}`;
  const expClass = classifyExperience(raw.title, desc, []);

  return {
    id: `remjob-${raw.id || Buffer.from(raw.url).toString("base64url").slice(0, 16)}`,
    isDemo: false,
    title: raw.title.trim(),
    organisation: raw.company_name?.trim() || "Company not specified",
    category: "job",
    description: desc,
    eligibilityCriteria:
      "Academic requirements are not structured by Remotive — verify on the original listing.",
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
    stipendOrSalary: raw.salary?.trim() || "Salary not specified",
    salaryCurrency: null,
    deadline: null,
    applicationUrl: raw.url,
    sourceName: "Remotive",
    sourceUrl: "https://remotive.com",
    datePublished: raw.publication_date ? raw.publication_date.slice(0, 10) : null,
    lastVerifiedAt: fetchedAtIso.slice(0, 10),
    lastFetchedAt: fetchedAtIso,
    status: "active",
    employmentType:
      raw.job_type === "contract"
        ? "Contract"
        : raw.job_type === "part_time"
        ? "Part-time"
        : "Full-time",
    locationRestrictions: loc ? [loc] : [],
    hasAcademicCriteria: false,
    sourceBadge: "LIVE API",
    indiaEligibility: locLower.includes("india")
      ? "accepts_india"
      : acceptsIndia
      ? "worldwide"
      : "restricted_other",
    engineeringDomain: classifyEngineeringDomain(combined),
    applicationStatusLabel: "Open",
    companyLogo: raw.company_logo || null,
    experienceClassification: expClass,
    jobCategoryGroup: classifyJobCategoryGroup(combined),
  };
}

export const RemotiveJobProvider: InternshipProvider = {
  id: "remotive-jobs",
  name: "Remotive Jobs",
  sourceUrl: "https://remotive.com",
  isLive: true,

  async searchInternships(
    params: InternshipSearchParams
  ): Promise<InternshipProviderResult> {
    const query = params.query?.trim() || "";
    const url = new URL(REMOTIVE_API_URL);
    url.searchParams.set("category", "software-dev");
    if (query) url.searchParams.set("search", query);
    url.searchParams.set("limit", "20");

    const cacheKey = url.toString();
    const now = Date.now();
    if (!params.refresh) {
      const cached = remotiveJobCache.get(cacheKey);
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
          providerId: "remotive-jobs",
          providerName: "Remotive Jobs",
          providerUrl: "https://remotive.com",
          isLive: false,
          fetchedAt: new Date(now).toISOString(),
          totalCount: 0,
          page: 1,
          opportunities: [],
          cached: false,
          rateLimited: true,
          error: "Remotive Jobs API rate limit reached (HTTP 429).",
        };
      }

      if (!res.ok) {
        return {
          ok: false,
          providerId: "remotive-jobs",
          providerName: "Remotive Jobs",
          providerUrl: "https://remotive.com",
          isLive: false,
          fetchedAt: new Date(now).toISOString(),
          totalCount: 0,
          page: 1,
          opportunities: [],
          cached: false,
          error: `Remotive Jobs API returned HTTP ${res.status}.`,
        };
      }

      const data = (await res.json()) as { jobs?: RemotiveRawJob[] };
      const fetchedAt = new Date(now).toISOString();
      const normalized = (data.jobs || [])
        .map((j) => normalizeRemotiveNonInternJob(j, fetchedAt))
        .filter((o): o is Opportunity => o !== null);

      const result: InternshipProviderResult = {
        ok: true,
        providerId: "remotive-jobs",
        providerName: "Remotive Jobs",
        providerUrl: "https://remotive.com",
        isLive: true,
        fetchedAt,
        totalCount: normalized.length,
        page: 1,
        opportunities: normalized,
        cached: false,
      };

      remotiveJobCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, result });
      return result;
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      return {
        ok: false,
        providerId: "remotive-jobs",
        providerName: "Remotive Jobs",
        providerUrl: "https://remotive.com",
        isLive: false,
        fetchedAt: new Date(now).toISOString(),
        totalCount: 0,
        page: 1,
        opportunities: [],
        cached: false,
        error: isAbort
          ? "Request to Remotive Jobs timed out."
          : "Could not reach Remotive Jobs service.",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
