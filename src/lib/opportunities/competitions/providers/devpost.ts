import { Opportunity } from "@/types";
import { classifyEngineeringDomain } from "@/lib/opportunities/providers/classify";
import {
  classifyCompetitionSubCategory,
  isCompetitionBeginnerFriendly,
} from "../classify";
import {
  CompetitionProvider,
  CompetitionProviderResult,
  CompetitionSearchParams,
} from "../types";

const DEVPOST_API_URL = "https://devpost.com/api/hackathons";
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8500;

interface DevpostTheme {
  id?: number;
  name?: string;
}

interface DevpostRawHackathon {
  id?: number;
  title?: string;
  url?: string;
  submission_period_dates?: string;
  open_state?: string;
  prize_amount?: string;
  themes?: DevpostTheme[];
  displayed_location?: {
    icon?: string;
    location?: string;
  };
  organization_name?: string;
  thumbnail_url?: string;
  invite_only?: boolean;
}

interface DevpostApiResponse {
  hackathons?: DevpostRawHackathon[];
  meta?: {
    total_count?: number;
    per_page?: number;
  };
}

const devpostCache = new Map<
  string,
  { expiresAt: number; result: CompetitionProviderResult }
>();
let lastSuccessfulDevpostFetch: string | null = null;

export function getLastSuccessfulDevpostFetch(): string | null {
  return lastSuccessfulDevpostFetch;
}

function stripHtmlTags(raw?: string): string {
  if (!raw) return "";
  return raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function normalizeDevpostHackathon(
  raw: DevpostRawHackathon,
  fetchedAtIso: string
): Opportunity | null {
  if (!raw.title || !raw.url) return null;

  const themes = (raw.themes || [])
    .map((t) => t.name?.trim() || "")
    .filter(Boolean);

  const locText = raw.displayed_location?.location?.trim() || "Online";
  const locLower = locText.toLowerCase();
  const isOnline = locLower.includes("online") || locLower.includes("global");
  const isIndia = locLower.includes("india");
  const isOpen = raw.open_state?.toLowerCase() === "open";

  const combinedText = `${raw.title} ${themes.join(" ")} ${raw.organization_name || ""}`;
  const prizeClean = stripHtmlTags(raw.prize_amount);

  return {
    id: `devpost-${raw.id || Buffer.from(raw.url).toString("base64url").slice(0, 16)}`,
    isDemo: false,
    title: raw.title.trim(),
    organisation: raw.organization_name?.trim() || "Devpost Organizer",
    category: "hackathon",
    description: `Hackathon listed on Devpost${themes.length > 0 ? ` focusing on ${themes.join(", ")}` : ""}. Verify full rules and eligibility on the official Devpost page.`,
    eligibilityCriteria:
      "Detailed eligibility (student status, region, age, team rules) must be verified on the Devpost event page.",
    requiredDegrees: [],
    requiredBranches: [],
    eligibleYears: [],
    requiredSkills: themes,
    minGradYear: null,
    maxGradYear: null,
    minIncomeLakh: null,
    maxIncomeLakh: null,
    institutionTypes: [],
    location: locText,
    workMode: isOnline ? "Remote" : "On-site",
    stipendOrSalary: prizeClean ? `Prizes: ${prizeClean}` : "Prize details on official page",
    deadline: null,
    eventDatesLabel: raw.submission_period_dates || null,
    prizeOrReward: prizeClean || null,
    participationFee: null,
    teamSizeLabel: null,
    applicationUrl: raw.url,
    sourceName: "Devpost",
    sourceUrl: "https://devpost.com/hackathons",
    datePublished: null,
    lastVerifiedAt: fetchedAtIso.slice(0, 10),
    lastFetchedAt: fetchedAtIso,
    status: isOpen ? "active" : "expired",
    hasAcademicCriteria: false,
    sourceBadge: "LIVE API",
    indiaEligibility: isIndia
      ? "india_based"
      : isOnline
      ? "worldwide"
      : "location_unknown",
    engineeringDomain: classifyEngineeringDomain(combinedText),
    applicationStatusLabel: isOpen ? "Open" : "Closed",
    competitionSubCategory: classifyCompetitionSubCategory(raw.title, themes),
    beginnerFriendly: isCompetitionBeginnerFriendly(raw.title, themes),
    companyLogo: raw.thumbnail_url
      ? raw.thumbnail_url.startsWith("//")
        ? `https:${raw.thumbnail_url}`
        : raw.thumbnail_url
      : null,
  };
}

export const DevpostCompetitionProvider: CompetitionProvider = {
  id: "devpost",
  name: "Devpost",
  sourceUrl: "https://devpost.com/hackathons",
  isLive: true,

  async searchCompetitions(
    params: CompetitionSearchParams
  ): Promise<CompetitionProviderResult> {
    const page = Math.max(1, params.page || 1);
    const query = params.query?.trim() || "";

    const url = new URL(DEVPOST_API_URL);
    url.searchParams.append("open_state[]", "open");
    url.searchParams.set("per_page", "12");
    if (page > 1) url.searchParams.set("page", String(page));
    if (query) url.searchParams.set("search", query);

    const cacheKey = url.toString();
    const now = Date.now();
    if (!params.refresh) {
      const cached = devpostCache.get(cacheKey);
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
          providerId: "devpost",
          providerName: "Devpost",
          sourceUrl: "https://devpost.com/hackathons",
          isLive: false,
          isDemo: false,
          fetchedAt: lastSuccessfulDevpostFetch || new Date(now).toISOString(),
          totalCount: 0,
          page,
          opportunities: [],
          cached: false,
          rateLimited: true,
          error: "Devpost API rate limit reached (HTTP 429).",
        };
      }

      if (!res.ok) {
        return {
          ok: false,
          providerId: "devpost",
          providerName: "Devpost",
          sourceUrl: "https://devpost.com/hackathons",
          isLive: false,
          isDemo: false,
          fetchedAt: lastSuccessfulDevpostFetch || new Date(now).toISOString(),
          totalCount: 0,
          page,
          opportunities: [],
          cached: false,
          error: `Devpost API returned HTTP ${res.status}.`,
        };
      }

      const data = (await res.json()) as DevpostApiResponse;
      const fetchedAt = new Date(now).toISOString();
      const normalized = (data.hackathons || [])
        .map((h) => normalizeDevpostHackathon(h, fetchedAt))
        .filter((o): o is Opportunity => o !== null);

      lastSuccessfulDevpostFetch = fetchedAt;

      const result: CompetitionProviderResult = {
        ok: true,
        providerId: "devpost",
        providerName: "Devpost",
        sourceUrl: "https://devpost.com/hackathons",
        isLive: true,
        isDemo: false,
        fetchedAt,
        totalCount: data.meta?.total_count ?? normalized.length,
        page,
        opportunities: normalized,
        cached: false,
      };

      devpostCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, result });
      return result;
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      return {
        ok: false,
        providerId: "devpost",
        providerName: "Devpost",
        sourceUrl: "https://devpost.com/hackathons",
        isLive: false,
        isDemo: false,
        fetchedAt: lastSuccessfulDevpostFetch || new Date(now).toISOString(),
        totalCount: 0,
        page,
        opportunities: [],
        cached: false,
        error: isAbort
          ? "Request to Devpost timed out."
          : "Could not reach Devpost service.",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
