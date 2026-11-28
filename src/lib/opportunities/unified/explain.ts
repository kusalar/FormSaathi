import { matchCompetition } from "@/lib/opportunities/competitions/matcher";
import { matchOpportunity } from "@/lib/opportunities/matcher";
import { matchNormalizedScholarship } from "@/lib/scholarships/matcher";
import { StudentProfile } from "@/types";
import {
  UnifiedMatchExplanation,
  UnifiedMatchStatus,
  UnifiedOpportunity,
} from "./types";

function mapScholarshipStatus(
  status: ReturnType<typeof matchNormalizedScholarship>["status"]
): UnifiedMatchStatus {
  switch (status) {
    case "INDICATIVE_MATCH":
      return "eligible";
    case "NEEDS_INFORMATION":
      return "needs_information";
    case "NEEDS_VERIFICATION":
      return "needs_verification";
    case "NOT_ELIGIBLE":
      return "ineligible";
    case "CLOSED":
      return "closed";
  }
}

function mapOpportunityStatus(
  status: ReturnType<typeof matchOpportunity>["eligibilityStatus"]
): UnifiedMatchStatus {
  switch (status) {
    case "eligible":
      return "eligible";
    case "needs_verification":
      return "needs_verification";
    case "ineligible":
      return "ineligible";
    case "expired":
      return "closed";
  }
}

function buildSummaryText(
  status: UnifiedMatchStatus,
  reasons: string[],
  gaps: string[],
  verificationNeeded: string[]
): string {
  if (status === "closed") {
    return "Application window is closed or past deadline.";
  }
  if (status === "ineligible") {
    return gaps[0]
      ? `Likely ineligible: ${gaps[0]}`
      : "Does not match one or more stated criteria.";
  }
  if (status === "needs_information") {
    return verificationNeeded[0]
      ? `Complete your profile to confirm: ${verificationNeeded[0]}`
      : "Add more profile details for a sharper eligibility check.";
  }
  if (status === "needs_verification") {
    return reasons[0]
      ? `${reasons[0]}. Verify remaining details on the official portal.`
      : "Preliminary match only — verify full eligibility on the official portal.";
  }
  return reasons.length > 0
    ? `${reasons.slice(0, 2).join(" • ")}. Confirm final criteria on the official portal.`
    : "Preliminary match based on your current profile — confirm on the official portal.";
}

export function explainUnifiedMatch(
  profile: StudentProfile,
  item: UnifiedOpportunity,
  todayIso?: string
): UnifiedMatchExplanation {
  if (item.originalScholarship) {
    const res = matchNormalizedScholarship(
      profile,
      item.originalScholarship,
      todayIso
    );
    const status = mapScholarshipStatus(res.status);
    return {
      percentage: res.percentage,
      status,
      reasons: res.satisfied,
      gaps: res.notSatisfied,
      verificationNeeded: [...res.unknown, ...res.verifyOnPortal],
      summary: buildSummaryText(
        status,
        res.satisfied,
        res.notSatisfied,
        [...res.unknown, ...res.verifyOnPortal]
      ),
      isIndicativeOnly: true,
    };
  }

  if (item.originalOpportunity) {
    const opp = item.originalOpportunity;
    const isComp =
      Boolean(opp.competitionSubCategory) ||
      opp.category === "hackathon" ||
      opp.category === "competition" ||
      opp.category === "ambassador" ||
      opp.category === "fellowship";

    const res = isComp
      ? matchCompetition(profile, opp, todayIso)
      : matchOpportunity(profile, opp, todayIso);

    const status = mapOpportunityStatus(res.eligibilityStatus);
    return {
      percentage: res.percentage,
      status,
      reasons: res.reasons,
      gaps: res.gaps,
      verificationNeeded: res.verificationNeeded,
      summary: buildSummaryText(
        status,
        res.reasons,
        res.gaps,
        res.verificationNeeded
      ),
      isIndicativeOnly: true,
    };
  }

  return {
    percentage: 50,
    status: "needs_verification",
    reasons: [],
    gaps: [],
    verificationNeeded: ["Verify full eligibility on the official portal"],
    summary: "Preliminary match only — verify full eligibility on the official portal.",
    isIndicativeOnly: true,
  };
}
