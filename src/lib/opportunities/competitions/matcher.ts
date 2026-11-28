import { matchOpportunity, OpportunityMatchResult } from "@/lib/opportunities/matcher";
import { Opportunity, StudentProfile } from "@/types";

export function matchCompetition(
  profile: StudentProfile,
  opp: Opportunity,
  todayIso?: string
): OpportunityMatchResult {
  const base = matchOpportunity(profile, opp, todayIso);

  if (base.eligibilityStatus === "expired") {
    return base;
  }

  const extraReasons = [...base.reasons];
  if (opp.workMode === "Remote") {
    extraReasons.push("Online participation available");
  }
  if (opp.requiredDegrees.length > 0 && !profile.course) {
    // Already captured in verificationNeeded by matchOpportunity
  } else if (opp.requiredDegrees.includes(profile.course)) {
    // Ensure undergraduate friendliness is clear
    if (!extraReasons.some((r) => r.includes("Degree"))) {
      extraReasons.push("Open to undergraduate students");
    }
  }

  if (
    opp.hasAcademicCriteria === false &&
    !base.verificationNeeded.some((v) => v.toLowerCase().includes("eligibility"))
  ) {
    base.verificationNeeded.push("Academic eligibility needs verification");
  }

  return {
    ...base,
    reasons: Array.from(new Set(extraReasons)),
  };
}
