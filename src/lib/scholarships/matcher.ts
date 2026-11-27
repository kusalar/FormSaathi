import { parseIncomeToLakh } from "@/lib/scholarships";
import { NormalizedScholarship, StudentProfile } from "@/types";

export type ScholarshipMatchStatus =
  | "INDICATIVE_MATCH"
  | "NEEDS_INFORMATION"
  | "NEEDS_VERIFICATION"
  | "NOT_ELIGIBLE"
  | "CLOSED";

export interface ScholarshipMatchResult {
  percentage: number;
  status: ScholarshipMatchStatus;
  satisfied: string[];
  notSatisfied: string[];
  unknown: string[];
  verifyOnPortal: string[];
}

export function isScholarshipClosed(
  sch: NormalizedScholarship,
  todayIso?: string
): boolean {
  if (sch.applicationStatus === "CLOSED") return true;
  if (!sch.deadline || !todayIso) return false;
  return sch.deadline < todayIso;
}

/**
 * Transparent, deterministic scholarship matching engine.
 * - Never assumes caste, religion, gender, disability, or marks.
 * - Contradicted mandatory condition -> NOT_ELIGIBLE (capped <= 30%).
 * - Missing profile info -> NEEDS_INFORMATION.
 * - Unverified application window / special criteria -> NEEDS_VERIFICATION.
 */
export function matchNormalizedScholarship(
  profile: StudentProfile,
  sch: NormalizedScholarship,
  todayIso?: string
): ScholarshipMatchResult {
  if (isScholarshipClosed(sch, todayIso)) {
    return {
      percentage: 0,
      status: "CLOSED",
      satisfied: [],
      notSatisfied: ["Application window is closed"],
      unknown: [],
      verifyOnPortal: ["Check official portal for next cycle"],
    };
  }

  let earned = 0;
  let total = 0;
  let hardFail = false;

  const satisfied: string[] = [];
  const notSatisfied: string[] = [];
  const unknown: string[] = [];
  const verifyOnPortal: string[] = [];

  // 1. State / Domicile (weight 25)
  if (sch.eligibleStates.length > 0) {
    total += 25;
    if (!profile.state) {
      unknown.push("Home state / domicile");
    } else if (
      sch.eligibleStates.some(
        (st) => st.toLowerCase() === profile.state.toLowerCase()
      )
    ) {
      earned += 25;
      satisfied.push(`State (${profile.state}) matches`);
    } else {
      hardFail = true;
      notSatisfied.push(`Restricted to ${sch.eligibleStates.join(", ")} domicile`);
    }
  }

  // 2. Degree / Course (weight 25)
  if (sch.eligibleDegrees.length > 0) {
    total += 25;
    if (!profile.course) {
      unknown.push("Degree / Course");
    } else if (sch.eligibleDegrees.includes(profile.course)) {
      earned += 25;
      satisfied.push(`Degree (${profile.course}) eligible`);
    } else {
      hardFail = true;
      notSatisfied.push(`For ${sch.eligibleDegrees.slice(0, 4).join(", ")} only`);
    }
  }

  // 3. Branch (weight 15)
  if (sch.eligibleBranches.length > 0) {
    total += 15;
    const branch = (profile.branch || "").trim().toLowerCase();
    if (!branch) {
      unknown.push("Academic branch");
    } else if (
      sch.eligibleBranches.some(
        (b) => branch.includes(b.toLowerCase()) || b.toLowerCase().includes(branch)
      )
    ) {
      earned += 15;
      satisfied.push(`Branch (${profile.branch}) matches`);
    } else {
      notSatisfied.push(`Targeted branches: ${sch.eligibleBranches.slice(0, 3).join(", ")}`);
    }
  }

  // 4. Academic Year (weight 15)
  if (sch.eligibleAcademicYears.length > 0) {
    total += 15;
    if (!profile.year) {
      unknown.push("Current academic year");
    } else if (sch.eligibleAcademicYears.includes(profile.year)) {
      earned += 15;
      satisfied.push(`Academic year (${profile.year}) eligible`);
    } else {
      hardFail = true;
      notSatisfied.push(`For ${sch.eligibleAcademicYears.join(", ")} students`);
    }
  }

  // 5. Family Income Ceiling (weight 25)
  if (sch.maxIncomeLakh !== null) {
    total += 25;
    const userLakh = parseIncomeToLakh(profile.annualIncome);
    if (userLakh === null) {
      unknown.push("Approximate family income");
    } else if (userLakh <= sch.maxIncomeLakh) {
      earned += 25;
      satisfied.push(`Within income ceiling (≤ ₹${sch.maxIncomeLakh}L)`);
    } else {
      hardFail = true;
      notSatisfied.push(`Income exceeds ₹${sch.maxIncomeLakh}L ceiling`);
    }
  }

  // 6. Institution Type (weight 10)
  if (sch.eligibleInstitutionTypes.length > 0) {
    total += 10;
    if (!profile.institutionType) {
      unknown.push("Institution type");
    } else if (sch.eligibleInstitutionTypes.includes(profile.institutionType)) {
      earned += 10;
      satisfied.push(`${profile.institutionType} institution eligible`);
    } else {
      hardFail = true;
      notSatisfied.push(`For ${sch.eligibleInstitutionTypes.join(" / ")} colleges`);
    }
  }

  // 7. Special / Unverified conditions (never assumed!)
  if (sch.minAcademicPercentage !== null) {
    verifyOnPortal.push(`Minimum ${sch.minAcademicPercentage}% qualifying marks`);
  }
  if (sch.specialConditions.length > 0) {
    verifyOnPortal.push(...sch.specialConditions);
  }
  if (sch.applicationStatus === "UNVERIFIED") {
    verifyOnPortal.push("Confirm current academic year open window on official portal");
  }

  let percentage = total > 0 ? Math.round((earned / total) * 100) : 50;
  if (hardFail) {
    percentage = Math.min(percentage, 30);
  }

  let status: ScholarshipMatchStatus = "INDICATIVE_MATCH";
  if (hardFail) {
    status = "NOT_ELIGIBLE";
  } else if (unknown.length > 0) {
    status = "NEEDS_INFORMATION";
  } else if (
    sch.applicationStatus === "UNVERIFIED" ||
    sch.minAcademicPercentage !== null ||
    sch.specialConditions.length > 0
  ) {
    status = "NEEDS_VERIFICATION";
  }

  return {
    percentage,
    status,
    satisfied,
    notSatisfied,
    unknown,
    verifyOnPortal,
  };
}
