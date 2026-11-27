import { Opportunity, StudentProfile } from "@/types";
import { parseIncomeToLakh } from "@/lib/scholarships";

export type EligibilityBadgeStatus =
  | "eligible"
  | "needs_verification"
  | "ineligible"
  | "expired";

export interface OpportunityMatchResult {
  percentage: number;
  eligibilityStatus: EligibilityBadgeStatus;
  reasons: string[];
  gaps: string[];
  verificationNeeded: string[];
}

const BRANCH_ALIASES: Record<string, string[]> = {
  cse: ["cse", "computer science", "cs", "computer engineering", "software"],
  it: ["it", "information technology"],
  ece: ["ece", "electronics", "electronics and communication", "communication"],
  eee: ["eee", "electrical", "electrical engineering"],
  mechanical: ["me", "mech", "mechanical", "mechanical engineering"],
  "data science": ["data science", "ai", "ml", "artificial intelligence", "machine learning"],
};

function normalizeBranch(branch: string): string[] {
  const lower = branch.trim().toLowerCase();
  if (!lower) return [];
  const tokens = new Set<string>([lower]);
  for (const [key, aliases] of Object.entries(BRANCH_ALIASES)) {
    if (aliases.some((a) => lower.includes(a) || a.includes(lower))) {
      tokens.add(key);
      aliases.forEach((a) => tokens.add(a));
    }
  }
  return Array.from(tokens);
}

function tokenizeSkills(skillsText?: string): string[] {
  if (!skillsText) return [];
  return skillsText
    .split(/[,;/|]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isOpportunityExpired(opp: Opportunity, todayIso?: string): boolean {
  if (opp.status === "expired") return true;
  if (!opp.deadline || !todayIso) return false;
  return opp.deadline < todayIso;
}

/**
 * Deterministic, explainable profile-to-opportunity matching engine.
 *
 * Rules:
 * 1. Expired opportunities always return 0% and status "expired".
 * 2. Missing profile fields NEVER count as a match; they are added to `verificationNeeded`.
 * 3. Hard eligibility failures (e.g., income limit exceeded, restricted degree/state/institution)
 *    mark status "ineligible" and cap score at 35%, regardless of other points.
 * 4. Missing required criteria mark status "needs_verification" instead of "eligible".
 */
export function matchOpportunity(
  profile: StudentProfile,
  opp: Opportunity,
  todayIso?: string
): OpportunityMatchResult {
  if (isOpportunityExpired(opp, todayIso)) {
    return {
      percentage: 0,
      eligibilityStatus: "expired",
      reasons: [],
      gaps: ["Application deadline has passed"],
      verificationNeeded: [],
    };
  }

  let earnedWeight = 0;
  let totalWeight = 0;
  let hardFail = false;
  const reasons: string[] = [];
  const gaps: string[] = [];
  const verificationNeeded: string[] = [];

  // 1. Degree / Course (weight 25)
  if (opp.requiredDegrees.length > 0) {
    totalWeight += 25;
    if (!profile.course) {
      verificationNeeded.push("Degree / Course");
    } else if (opp.requiredDegrees.includes(profile.course)) {
      earnedWeight += 25;
      reasons.push(`Degree (${profile.course}) matches`);
    } else {
      hardFail = true;
      gaps.push(`Requires ${opp.requiredDegrees.slice(0, 3).join(", ")}`);
    }
  }

  // 2. Branch / Specialization (weight 20)
  if (opp.requiredBranches.length > 0) {
    totalWeight += 20;
    const userBranchTokens = normalizeBranch(profile.branch || "");
    if (userBranchTokens.length === 0) {
      verificationNeeded.push("Branch / Specialization");
    } else {
      const reqLower = opp.requiredBranches.map((b) => b.toLowerCase());
      const branchMatch = userBranchTokens.some((t) => reqLower.includes(t));
      if (branchMatch) {
        earnedWeight += 20;
        reasons.push(`Branch (${profile.branch}) matches`);
      } else {
        gaps.push(`Preferred branches: ${opp.requiredBranches.slice(0, 3).join(", ")}`);
      }
    }
  }

  // 3. Academic Year (weight 15)
  if (opp.eligibleYears.length > 0) {
    totalWeight += 15;
    if (!profile.year) {
      verificationNeeded.push("Academic Year");
    } else if (opp.eligibleYears.includes(profile.year)) {
      earnedWeight += 15;
      reasons.push(`${profile.year} is eligible`);
    } else {
      hardFail = true;
      gaps.push(`Open to ${opp.eligibleYears.join(", ")}`);
    }
  }

  // 4. Graduation Year (weight 10)
  if (opp.minGradYear !== null || opp.maxGradYear !== null) {
    totalWeight += 10;
    const gradNum = profile.graduationYear ? parseInt(profile.graduationYear, 10) : NaN;
    if (Number.isNaN(gradNum)) {
      verificationNeeded.push("Graduation Year");
    } else {
      const minOk = opp.minGradYear === null || gradNum >= opp.minGradYear;
      const maxOk = opp.maxGradYear === null || gradNum <= opp.maxGradYear;
      if (minOk && maxOk) {
        earnedWeight += 10;
        reasons.push(`Graduation year (${gradNum}) fits`);
      } else {
        hardFail = true;
        gaps.push(
          `Graduation year ${opp.minGradYear ?? ""}–${opp.maxGradYear ?? ""} required`
        );
      }
    }
  }

  // 5. Family Income (Scholarships, weight 20)
  if (opp.maxIncomeLakh !== null) {
    totalWeight += 20;
    const userLakh = parseIncomeToLakh(profile.annualIncome);
    if (userLakh === null) {
      verificationNeeded.push("Family Income");
    } else if (userLakh <= opp.maxIncomeLakh) {
      earnedWeight += 20;
      reasons.push(`Income within ≤ ₹${opp.maxIncomeLakh}L limit`);
    } else {
      hardFail = true;
      gaps.push(`Income exceeds ₹${opp.maxIncomeLakh}L limit`);
    }
  }

  // 6. Institution Type (weight 10)
  if (opp.institutionTypes.length > 0) {
    totalWeight += 10;
    if (!profile.institutionType) {
      verificationNeeded.push("Institution Type");
    } else if (opp.institutionTypes.includes(profile.institutionType)) {
      earnedWeight += 10;
      reasons.push(`${profile.institutionType} college eligible`);
    } else {
      hardFail = true;
      gaps.push(`For ${opp.institutionTypes.join(" / ")} colleges`);
    }
  }

  // 7. State / Location (weight 15 when restricted, 5 bonus when matching)
  if (opp.location !== "All India" && opp.workMode !== "Remote") {
    totalWeight += 15;
    if (!profile.state) {
      verificationNeeded.push("State / Location");
    } else if (profile.state.toLowerCase() === opp.location.toLowerCase()) {
      earnedWeight += 15;
      reasons.push(`Location (${opp.location}) matches`);
    } else {
      if (opp.category === "scholarship") {
        hardFail = true;
      }
      gaps.push(`Located in ${opp.location}`);
    }
  }

  // 8. Skills Overlap (Internships & Jobs, weight 25)
  if (opp.requiredSkills.length > 0) {
    totalWeight += 25;
    const userSkills = tokenizeSkills(profile.skills);
    if (userSkills.length === 0) {
      verificationNeeded.push("Skills");
    } else {
      const matchedSkills = opp.requiredSkills.filter((req) =>
        userSkills.some(
          (us) => us === req.toLowerCase() || us.includes(req.toLowerCase()) || req.toLowerCase().includes(us)
        )
      );
      if (matchedSkills.length > 0) {
        const ratio = Math.min(1, matchedSkills.length / Math.min(3, opp.requiredSkills.length));
        earnedWeight += Math.round(25 * ratio);
        reasons.push(`Skills match: ${matchedSkills.slice(0, 3).join(", ")}`);
      } else {
        gaps.push(`Skills needed: ${opp.requiredSkills.slice(0, 3).join(", ")}`);
      }
    }
  }

  // 9. Work Mode Preference (weight 10)
  totalWeight += 10;
  if (!profile.preferredWorkMode) {
    verificationNeeded.push("Work Mode Preference");
  } else if (
    profile.preferredWorkMode === "Any" ||
    profile.preferredWorkMode === opp.workMode
  ) {
    earnedWeight += 10;
    reasons.push(`Work mode (${opp.workMode}) matches`);
  } else {
    gaps.push(`Work mode is ${opp.workMode}`);
  }

  // 10. Category Preference bonus (weight 5)
  if ((profile.preferredCategories || []).length > 0) {
    totalWeight += 5;
    const prefLower = (profile.preferredCategories || []).map((c) => c.toLowerCase());
    if (
      prefLower.some(
        (c) => c.includes(opp.category) || opp.category.includes(c.replace(/s$/, ""))
      )
    ) {
      earnedWeight += 5;
    }
  }

  let percentage = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  if (hardFail) {
    percentage = Math.min(percentage, 35);
  }

  const eligibilityStatus: EligibilityBadgeStatus = hardFail
    ? "ineligible"
    : verificationNeeded.length > 0
    ? "needs_verification"
    : "eligible";

  return {
    percentage,
    eligibilityStatus,
    reasons,
    gaps,
    verificationNeeded,
  };
}
