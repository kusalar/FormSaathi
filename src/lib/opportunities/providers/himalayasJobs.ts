import { Opportunity } from "@/types";
import { classifyEngineeringDomain } from "./classify";
import { classifyExperience, classifyJobCategoryGroup } from "./classifyJob";
import { HimalayasRawJob } from "./himalayas";
import {
  InternshipProvider,
  InternshipProviderResult,
  InternshipSearchParams,
} from "./types";

const HIMALAYAS_SEARCH_URL = "https://himalayas.app/jobs/api/search";
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8500;

interface HimalayasApiResponse {
  jobs?: HimalayasRawJob[];
  totalCount?: number;
}

const jobCache = new Map<string, { expiresAt: number; result: InternshipProviderResult }>();
let lastSuccessfulJobFetchAt: string | null = null;

export function getLastSuccessfulHimalayasJobFetch(): string | null {
  return lastSuccessfulJobFetchAt;
}

function unixSecondsToIsoDate(sec?: number | null): string | null {
  if (!sec || typeof sec !== "number" || sec <= 0) return null;
  try {
    return new Date(sec * 1000).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function formatSalary(raw: HimalayasRawJob): string {
  const min = typeof raw.minSalary === "number" && raw.minSalary > 0 ? raw.minSalary : null;
  const max = typeof raw.maxSalary === "number" && raw.maxSalary > 0 ? raw.maxSalary : null;
  if (!min && !max) return "Salary not specified";
  const cur = raw.currency || "";
  const period = raw.salaryPeriod ? ` / ${raw.salaryPeriod}` : "";
  if (min && max && min !== max) {
    return `${cur} ${min.toLocaleString()} – ${max.toLocaleString()}${period}`.trim();
  }
  return `${cur} ${(min ?? max)?.toLocaleString()}${period}`.trim();
}

export function normalizeHimalayasNonInternJob(
  raw: HimalayasRawJob,
  fetchedAtIso: string,
  nowMs: number = Date.now()
): Opportunity | null {
  if (!raw.title || !raw.applicationLink) return null;

  // Never classify an internship as a job!
  if (raw.employmentType?.toLowerCase() === "intern") return null;
  if (/\bintern(ship)?\b/i.test(raw.title)) return null;

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
      : restrictions.length > 3
      ? `${restrictions.slice(0, 3).join(", ")} +${restrictions.length - 3} more`
      : restrictions.join(", ");

  const skills = Array.from(
    new Set(
      [...(raw.categories || []), ...(raw.parentCategories || [])]
        .map((t) => t.replace(/[-_]+/g, " ").trim())
        .filter(Boolean)
    )
  );

  const stableKey =
    raw.guid ||
    `${raw.companySlug || raw.companyName || "org"}-${raw.title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

  const id = `himjob-${Buffer.from(stableKey).toString("base64url").slice(0, 22)}`;

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

  const excerpt = raw.excerpt?.trim() || "Remote job listing retrieved from Himalayas.";
  const combinedText = `${raw.title} ${excerpt} ${skills.join(" ")}`;
  const expClass = classifyExperience(raw.title, excerpt, raw.seniority || []);

  return {
    id,
    isDemo: false,
    title: raw.title.trim(),
    organisation: raw.companyName?.trim() || "Company not specified",
    category: "job",
    description: excerpt,
    eligibilityCriteria:
      "Academic degree/branch requirements are not structured by Himalayas — verify on the original listing.",
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
    stipendOrSalary: formatSalary(raw),
    salaryCurrency: raw.currency || null,
    deadline: expiryDateIso,
    applicationUrl: raw.applicationLink,
    sourceName: "Himalayas",
    sourceUrl: "https://himalayas.app",
    datePublished: pubDateIso,
    lastVerifiedAt: fetchedAtIso.slice(0, 10),
    lastFetchedAt: fetchedAtIso,
    status: isExpired ? "expired" : "active",
    employmentType: raw.employmentType || "Full Time",
    locationRestrictions: restrictions,
    hasAcademicCriteria: false,
    sourceBadge: "LIVE API",
    indiaEligibility,
    engineeringDomain: classifyEngineeringDomain(combinedText),
    applicationStatusLabel: isExpired ? "Closed" : "Open",
    companyLogo: raw.companyLogo || null,
    experienceClassification: expClass,
    jobCategoryGroup: classifyJobCategoryGroup(combinedText),
    seniorityLabels: raw.seniority || [],
  };
}

export const HimalayasJobProvider: InternshipProvider = {
  id: "himalayas-jobs",
  name: "Himalayas Jobs",
  sourceUrl: "https://himalayas.app",
  isLive: true,

  async searchInternships(
    params: InternshipSearchParams
  ): Promise<InternshipProviderResult> {
    const page = Math.max(1, params.page || 1);
    const query = params.query?.trim() || "";
    const country = params.country?.trim() || "";

    const url = new URL(HIMALAYAS_SEARCH_URL);
    url.searchParams.set("employment_type", "Full Time");
    if (country) url.searchParams.set("country", country);
    if (query) url.searchParams.set("q", query);
    if (page > 1) url.searchParams.set("page", String(page));

    const cacheKey = url.toString();
    const now = Date.now();

    if (!params.refresh) {
      const cached = jobCache.get(cacheKey);
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
          "User-Agent": "FormSaathi/1.0 (Student Job Discovery)",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (res.status === 429) {
        return {
          ok: false,
          providerId: "himalayas-jobs",
          providerName: "Himalayas Jobs",
          providerUrl: "https://himalayas.app",
          isLive: false,
          fetchedAt: lastSuccessfulJobFetchAt || new Date(now).toISOString(),
          totalCount: 0,
          page,
          opportunities: [],
          cached: false,
          rateLimited: true,
          error: "Himalayas Jobs API rate limit reached (HTTP 429).",
        };
      }

      if (!res.ok) {
        return {
          ok: false,
          providerId: "himalayas-jobs",
          providerName: "Himalayas Jobs",
          providerUrl: "https://himalayas.app",
          isLive: false,
          fetchedAt: lastSuccessfulJobFetchAt || new Date(now).toISOString(),
          totalCount: 0,
          page,
          opportunities: [],
          cached: false,
          error: `Himalayas Jobs API returned HTTP ${res.status}.`,
        };
      }

      const data = (await res.json()) as HimalayasApiResponse;
      const fetchedAt = new Date(now).toISOString();
      const normalized = (data.jobs || [])
        .map((j) => normalizeHimalayasNonInternJob(j, fetchedAt, now))
        .filter((o): o is Opportunity => o !== null);

      lastSuccessfulJobFetchAt = fetchedAt;

      const result: InternshipProviderResult = {
        ok: true,
        providerId: "himalayas-jobs",
        providerName: "Himalayas Jobs",
        providerUrl: "https://himalayas.app",
        isLive: true,
        fetchedAt,
        totalCount: typeof data.totalCount === "number" ? data.totalCount : normalized.length,
        page,
        opportunities: normalized,
        cached: false,
      };

      jobCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, result });
      return result;
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      return {
        ok: false,
        providerId: "himalayas-jobs",
        providerName: "Himalayas Jobs",
        providerUrl: "https://himalayas.app",
        isLive: false,
        fetchedAt: lastSuccessfulJobFetchAt || new Date(now).toISOString(),
        totalCount: 0,
        page,
        opportunities: [],
        cached: false,
        error: isAbort
          ? "Request to Himalayas Jobs timed out."
          : "Could not reach Himalayas Jobs service.",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
