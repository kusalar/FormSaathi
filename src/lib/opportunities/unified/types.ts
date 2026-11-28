import {
  ApplicationStatusLabel,
  CompetitionSubCategory,
  EngineeringDomainType,
  ExperienceClassification,
  IndiaEligibilityType,
  NormalizedScholarship,
  Opportunity,
  ScholarshipGroupCategory,
  WorkMode,
} from "@/types";

export type UnifiedCategory =
  | "scholarship"
  | "internship"
  | "job"
  | "hackathon"
  | "competition"
  | "ambassador"
  | "fellowship"
  | "research";

export type UnifiedDataSourceType =
  | "LIVE API"
  | "OFFICIAL SOURCE"
  | "OFFICIAL DIRECTORY"
  | "VERIFIED INFORMATION"
  | "NEEDS VERIFICATION"
  | "CURATED"
  | "DEMO";

export type UnifiedMatchStatus =
  | "eligible"
  | "needs_verification"
  | "needs_information"
  | "ineligible"
  | "closed";

export interface UnifiedOpportunity {
  id: string;
  sourceId: string;
  isDemo: boolean;
  title: string;
  organisation: string;
  category: UnifiedCategory;
  subCategory: string;
  description: string;
  eligibilitySummary: string;
  requiredDegrees: string[];
  requiredBranches: string[];
  eligibleYears: string[];
  requiredSkills: string[];
  maxIncomeLakh: number | null;
  institutionTypes: string[];
  location: string;
  workMode: WorkMode;
  stipendOrReward: string;
  deadline: string | null; // YYYY-MM-DD
  publishedDate: string | null; // YYYY-MM-DD or ISO
  applicationUrl: string | null;
  officialSourceUrl: string | null;
  sourceName: string;
  dataSourceType: UnifiedDataSourceType;
  applicationStatusLabel: ApplicationStatusLabel;
  indiaEligibility?: IndiaEligibilityType;
  engineeringDomain?: EngineeringDomainType;
  experienceClassification?: ExperienceClassification;
  competitionSubCategory?: CompetitionSubCategory;
  scholarshipCategory?: ScholarshipGroupCategory;
  beginnerFriendly?: boolean;
  lastVerifiedAt: string;
  lastFetchedAt: string;
  companyLogo?: string | null;
  requiredDocuments?: string[];
  originalScholarship?: NormalizedScholarship;
  originalOpportunity?: Opportunity;
}

export interface UnifiedMatchExplanation {
  percentage: number;
  status: UnifiedMatchStatus;
  reasons: string[];
  gaps: string[];
  verificationNeeded: string[];
  summary: string;
  isIndicativeOnly: boolean;
}

export interface RankedUnifiedOpportunity extends UnifiedOpportunity {
  match: UnifiedMatchExplanation;
  rankScore: number;
  urgencyDays: number | null;
  isClosingSoon: boolean;
  isRecentlyAdded: boolean;
  sectionTags: string[];
}

export interface UnifiedProviderStatus {
  providerId: string;
  providerName: string;
  categoryGroup: "scholarships" | "internships" | "jobs" | "competitions";
  ok: boolean;
  isLive: boolean;
  isDemo: boolean;
  count: number;
  cached?: boolean;
  error?: string;
}

export interface UnifiedCategoryCounts {
  all: number;
  scholarship: number;
  internship: number;
  job: number;
  hackathon: number;
  competition: number;
  ambassador: number;
  fellowship: number;
  research: number;
}

export interface UnifiedRecommendationsResponse {
  ok: boolean;
  fetchedAt: string;
  todayIso: string;
  totalRawCount: number;
  totalDeduplicatedCount: number;
  deduplicatedRemovedCount: number;
  categoryCounts: UnifiedCategoryCounts;
  providers: UnifiedProviderStatus[];
  items: UnifiedOpportunity[];
  partialFailures: string[];
}
