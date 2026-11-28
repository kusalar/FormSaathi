import {
  ApplicationStatusLabel,
  NormalizedScholarship,
  Opportunity,
  ScholarshipApplicationStatus,
} from "@/types";
import {
  UnifiedCategory,
  UnifiedDataSourceType,
  UnifiedOpportunity,
} from "./types";

function mapScholarshipStatus(
  status: ScholarshipApplicationStatus
): ApplicationStatusLabel {
  switch (status) {
    case "OPEN":
      return "Open";
    case "UPCOMING":
      return "Upcoming";
    case "CLOSED":
      return "Closed";
    case "UNVERIFIED":
    case "INFORMATION_ONLY":
    default:
      return "Unverified";
  }
}

function mapScholarshipSourceBadge(
  type: NormalizedScholarship["dataSourceType"]
): UnifiedDataSourceType {
  switch (type) {
    case "LIVE API":
      return "LIVE API";
    case "OFFICIAL SOURCE":
      return "OFFICIAL SOURCE";
    case "VERIFIED INFORMATION":
      return "VERIFIED INFORMATION";
    case "NEEDS VERIFICATION":
      return "NEEDS VERIFICATION";
    case "DEMO":
    default:
      return "DEMO";
  }
}

function mapOpportunitySourceBadge(opp: Opportunity): UnifiedDataSourceType {
  if (opp.isDemo || opp.sourceBadge === "DEMO" || opp.sourceBadge === "DEMONSTRATION") {
    return "DEMO";
  }
  switch (opp.sourceBadge) {
    case "LIVE API":
      return "LIVE API";
    case "OFFICIAL SOURCE":
      return "OFFICIAL SOURCE";
    case "OFFICIAL DIRECTORY":
      return "OFFICIAL DIRECTORY";
    case "NEEDS VERIFICATION":
      return "NEEDS VERIFICATION";
    case "CURATED":
      return "CURATED";
    default:
      return "OFFICIAL DIRECTORY";
  }
}

function resolveOpportunityCategory(opp: Opportunity): UnifiedCategory {
  if (opp.competitionSubCategory === "student_ambassador" || opp.category === "ambassador") {
    return "ambassador";
  }
  if (opp.competitionSubCategory === "fellowship" || opp.category === "fellowship") {
    return "fellowship";
  }
  if (
    opp.category === "research" ||
    opp.competitionSubCategory === "research_competition" ||
    opp.engineeringDomain === "research"
  ) {
    // Keep internships with research domain as research only if explicitly research category
    if (opp.category === "research") return "research";
  }
  if (opp.category === "hackathon" || opp.competitionSubCategory === "hackathon") {
    return "hackathon";
  }
  if (opp.category === "competition") {
    return "competition";
  }
  if (opp.category === "job") {
    return "job";
  }
  if (opp.category === "scholarship") {
    return "scholarship";
  }
  return "internship";
}

function deriveScholarshipSubCategory(sch: NormalizedScholarship): string {
  return sch.category || sch.scholarshipType || "Scholarship";
}

function deriveOpportunitySubCategory(opp: Opportunity): string {
  if (opp.competitionSubCategory) {
    return opp.competitionSubCategory.replace(/_/g, " ");
  }
  if (opp.jobCategoryGroup) {
    return opp.jobCategoryGroup.replace(/_/g, " ");
  }
  if (opp.engineeringDomain && opp.engineeringDomain !== "other") {
    return opp.engineeringDomain.replace(/_/g, " ");
  }
  return opp.category;
}

export function normalizeScholarshipToUnified(
  sch: NormalizedScholarship
): UnifiedOpportunity {
  const locationParts = [
    ...sch.eligibleStates,
    ...sch.eligibleLocations,
  ].filter(Boolean);

  return {
    id: sch.id,
    sourceId: sch.sourceName,
    isDemo: sch.isDemo,
    title: sch.title,
    organisation: sch.provider,
    category: "scholarship",
    subCategory: deriveScholarshipSubCategory(sch),
    description: sch.description,
    eligibilitySummary:
      sch.specialConditions.length > 0
        ? sch.specialConditions.join("; ")
        : sch.verificationNotes || "Verify eligibility on the official portal.",
    requiredDegrees: sch.eligibleDegrees,
    requiredBranches: sch.eligibleBranches,
    eligibleYears: sch.eligibleAcademicYears,
    requiredSkills: [],
    maxIncomeLakh: sch.maxIncomeLakh,
    institutionTypes: sch.eligibleInstitutionTypes,
    location:
      locationParts.length > 0 ? locationParts.join(", ") : "All India",
    workMode: "Remote",
    stipendOrReward: sch.amountLabel || sch.benefitType || "See official portal",
    deadline: sch.deadline,
    publishedDate: sch.publishedDate,
    applicationUrl: sch.applicationUrl || sch.officialSourceUrl || null,
    officialSourceUrl: sch.officialSourceUrl || sch.applicationUrl || null,
    sourceName: sch.sourceName,
    dataSourceType: mapScholarshipSourceBadge(sch.dataSourceType),
    applicationStatusLabel: mapScholarshipStatus(sch.applicationStatus),
    indiaEligibility: "india_based",
    scholarshipCategory: sch.category,
    lastVerifiedAt: sch.lastVerifiedAt,
    lastFetchedAt: sch.lastFetchedAt,
    requiredDocuments: sch.requiredDocuments,
    originalScholarship: sch,
  };
}

export function normalizeOpportunityToUnified(
  opp: Opportunity
): UnifiedOpportunity {
  const category = resolveOpportunityCategory(opp);
  const statusLabel: ApplicationStatusLabel =
    opp.status === "expired"
      ? "Closed"
      : opp.applicationStatusLabel || "Open";

  return {
    id: opp.id,
    sourceId: opp.sourceName,
    isDemo: opp.isDemo,
    title: opp.title,
    organisation: opp.organisation,
    category,
    subCategory: deriveOpportunitySubCategory(opp),
    description: opp.description,
    eligibilitySummary: opp.eligibilityCriteria,
    requiredDegrees: opp.requiredDegrees,
    requiredBranches: opp.requiredBranches,
    eligibleYears: opp.eligibleYears,
    requiredSkills: opp.requiredSkills,
    maxIncomeLakh: opp.maxIncomeLakh,
    institutionTypes: opp.institutionTypes,
    location: opp.location || "India / Remote",
    workMode: opp.workMode || "Remote",
    stipendOrReward:
      opp.prizeOrReward ||
      opp.stipendOrSalary ||
      "Check official portal",
    deadline: opp.deadline,
    publishedDate: opp.datePublished,
    applicationUrl: opp.applicationUrl || opp.sourceUrl || null,
    officialSourceUrl: opp.sourceUrl || opp.applicationUrl || null,
    sourceName: opp.sourceName,
    dataSourceType: mapOpportunitySourceBadge(opp),
    applicationStatusLabel: statusLabel,
    indiaEligibility: opp.indiaEligibility,
    engineeringDomain: opp.engineeringDomain,
    experienceClassification: opp.experienceClassification,
    competitionSubCategory: opp.competitionSubCategory,
    beginnerFriendly: opp.beginnerFriendly,
    lastVerifiedAt: opp.lastVerifiedAt,
    lastFetchedAt: opp.lastFetchedAt || opp.lastVerifiedAt,
    companyLogo: opp.companyLogo,
    originalOpportunity: opp,
  };
}
