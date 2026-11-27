import { Opportunity } from "@/types";
import { classifyEngineeringDomain } from "./classify";
import {
  InternshipProvider,
  InternshipProviderResult,
  InternshipSearchParams,
} from "./types";

const HIMALAYAS_SEARCH_URL = "https://himalayas.app/jobs/api/search";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT_MS = 8500;

export interface HimalayasRawJob {
  title?: string;
  excerpt?: string;
  companyName?: string;
  companySlug?: string;
  companyLogo?: string;
  employmentType?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  salaryPeriod?: string | null;
  currency?: string | null;
  seniority?: string[];
  locationRestrictions?: string[];
  categories?: string[];
  parentCategories?: string[];
  description?: string;
  pubDate?: number | null;
  expiryDate?: number | null;
  applicationLink?: string;
  guid?: string;
}

interface HimalayasApiResponse {
  jobs?: HimalayasRawJob[];
  totalCount?: number;
  limit?: number;
  offset?: number;
  updatedAt?: string;
}

interface CacheEntry {
  expiresAt: number;
  result: InternshipProviderResult;
}

const serverCache = new Map<string, CacheEntry>();
let lastSuccessfulFetchAt: string | null = null;

export function getLastSuccessfulHimalayasFetch(): string | null {
  return lastSuccessfulFetchAt;
}

function unixSecondsToIsoDate(sec?: number | null): string | null {
  if (!sec || typeof sec !== "number" || sec <= 0) return null;
  try {
    return new Date(sec * 1000).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function formatHimalayasSalary(raw: HimalayasRawJob): string {
  const min = typeof raw.minSalary === "number" && raw.minSalary > 0 ? raw.minSalary : null;
  const max = typeof raw.maxSalary === "number" && raw.maxSalary > 0 ? raw.maxSalary : null;
  if (!min && !max) return "Compensation not specified";
  const cur = raw.currency || "";
  const period = raw.salaryPeriod ? ` / ${raw.salaryPeriod}` : "";
  if (min && max && min !== max) {
    return `${cur} ${min.toLocaleString()} – ${max.toLocaleString()}${period}`.trim();
  }
  const val = min ?? max;
  return `${cur} ${val?.toLocaleString()}${period}`.trim();
}

function cleanTags(tags?: string[]): string[] {
  if (!Array.isArray(tags)) return [];
  return Array.from(
    new Set(
      tags
        .map((t) => t.replace(/[-_]+/g, " ").trim())
        .filter(Boolean)
    )
  );
}

export function normalizeHimalayasJob(
  raw: HimalayasRawJob,
  fetchedAtIso: string,
  nowMs: number = Date.now()
): Opportunity | null {
  if (!raw.title || !raw.applicationLink) return null;
  if (raw.employmentType && raw.employmentType.toLowerCase() !== "intern") {
    return null;
  }

  const expiryDateIso = unixSecondsToIsoDate(raw.expiryDate);
  const pubDateIso = unixSecondsToIsoDate(raw.pubDate);
  const isExpired =
    typeof raw.expiryDate === "number" && raw.expiryDate > 0
      ? raw.expiryDate * 1000 < nowMs
      : false;

  const restrictions = Array.isArray(raw.locationRestrictions)
    ? raw.locationRestrictions.filter(Boolean)
    : [];

  const locationLabel =
    restrictions.length === 0
      ? "Worldwide (Remote)"
      : restrictions.join(", ");

  const skills = cleanTags([
    ...(raw.categories || []),
    ...(raw.parentCategories || []),
  ]);

  const stableKey =
    raw.guid ||
    `${raw.companySlug || raw.companyName || "org"}-${raw.title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

  const id = `him-${Buffer.from(stableKey).toString("base64url").slice(0, 24)}`;

  const hasIndia = restrictions.some((r) => {
    const rl = r.toLowerCase();
    return rl === "india" || rl === "in" || rl === "worldwide";
  });

  const indiaEligibility =
    restrictions.length === 0
      ? "worldwide"
      : hasIndia
      ? "accepts_india"
      : "restricted_other";

  const combinedText = `${raw.title} ${raw.excerpt || ""} ${skills.join(" ")}`;

  return {
    id,
    isDemo: false,
    title: raw.title.trim(),
    organisation: raw.companyName?.trim() || "Company not specified",
    category: "internship",
    description:
      raw.excerpt?.trim() ||
      "Remote internship listing retrieved from Himalayas.",
    eligibilityCriteria:
      "Academic eligibility (degree, branch, year) is not specified by Himalayas — verify on the original listing.",
    requiredDegrees: [],
    requiredBranches: [],
    eligibleYears: [],
    requiredSkills: skills,
    minGradYear: null,
    maxGradYear: null,
    minIncomeLakh: null,
    maxIncomeLakh: null,
    institutionTypes: [],
    location: locationLabel,
    workMode: "Remote",
    stipendOrSalary: formatHimalayasSalary(raw),
    deadline: expiryDateIso,
    applicationUrl: raw.applicationLink,
    sourceName: "Himalayas",
    sourceUrl: "https://himalayas.app",
    datePublished: pubDateIso,
    lastVerifiedAt: fetchedAtIso.slice(0, 10),
    lastFetchedAt: fetchedAtIso,
    status: isExpired ? "expired" : "active",
    employmentType: raw.employmentType || "Intern",
    locationRestrictions: restrictions,
    hasAcademicCriteria: false,
    sourceBadge: "LIVE API",
    indiaEligibility,
    engineeringDomain: classifyEngineeringDomain(combinedText),
    applicationStatusLabel: isExpired ? "Closed" : "Open",
    companyLogo: raw.companyLogo || null,
  };
}

export function deduplicateOpportunities(list: Opportunity[]): Opportunity[] {
  const seen = new Set<string>();
  const out: Opportunity[] = [];
  for (const item of list) {
    const key = (item.applicationUrl || item.id).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export const HimalayasInternshipProvider: InternshipProvider = {
  id: "himalayas",
  name: "Himalayas",
  sourceUrl: "https://himalayas.app",
  isLive: true,

  async searchInternships(
    params: InternshipSearchParams
  ): Promise<InternshipProviderResult> {
    const page = Math.max(1, params.page || 1);
    const query = params.query?.trim() || "";
    const country = params.country?.trim() || "";

    const url = new URL(HIMALAYAS_SEARCH_URL);
    url.searchParams.set("employment_type", "Intern");
    if (country) url.searchParams.set("country", country);
    if (query) url.searchParams.set("q", query);
    if (page > 1) url.searchParams.set("page", String(page));

    const cacheKey = url.toString();
    const now = Date.now();

    if (!params.refresh) {
      const cached = serverCache.get(cacheKey);
      if (cached && cached.expiresAt > now) {
        return { ...cached.result, cached: true };
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "FormSaathi/1.0 (Student Opportunity Discovery)",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (res.status === 429) {
        return {
          ok: false,
          providerId: "himalayas",
          providerName: "Himalayas",
          providerUrl: "https://himalayas.app",
          isLive: false,
          fetchedAt: lastSuccessfulFetchAt || new Date(now).toISOString(),
          totalCount: 0,
          page,
          opportunities: [],
          cached: false,
          rateLimited: true,
          error:
            "Himalayas API rate limit reached (HTTP 429). Please wait a moment and try again.",
        };
      }

      if (!res.ok) {
        return {
          ok: false,
          providerId: "himalayas",
          providerName: "Himalayas",
          providerUrl: "https://himalayas.app",
          isLive: false,
          fetchedAt: lastSuccessfulFetchAt || new Date(now).toISOString(),
          totalCount: 0,
          page,
          opportunities: [],
          cached: false,
          error: `Himalayas API returned HTTP ${res.status}.`,
        };
      }

      const data = (await res.json()) as HimalayasApiResponse;
      const fetchedAt = new Date(now).toISOString();
      const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];
      const normalized = rawJobs
        .map((j) => normalizeHimalayasJob(j, fetchedAt, now))
        .filter((o): o is Opportunity => o !== null);

      const deduped = deduplicateOpportunities(normalized);
      lastSuccessfulFetchAt = fetchedAt;

      const result: InternshipProviderResult = {
        ok: true,
        providerId: "himalayas",
        providerName: "Himalayas",
        providerUrl: "https://himalayas.app",
        isLive: true,
        fetchedAt,
        totalCount: typeof data.totalCount === "number" ? data.totalCount : deduped.length,
        page,
        opportunities: deduped,
        cached: false,
      };

      serverCache.set(cacheKey, {
        expiresAt: now + CACHE_TTL_MS,
        result,
      });

      return result;
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      return {
        ok: false,
        providerId: "himalayas",
        providerName: "Himalayas",
        providerUrl: "https://himalayas.app",
        isLive: false,
        fetchedAt: lastSuccessfulFetchAt || new Date(now).toISOString(),
        totalCount: 0,
        page,
        opportunities: [],
        cached: false,
        error: isAbort
          ? "Request to Himalayas timed out. Please try refreshing again."
          : "Could not reach Himalayas internship service right now.",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
