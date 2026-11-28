import { StudentProfile } from "@/types";
import { explainUnifiedMatch } from "./explain";
import {
  RankedUnifiedOpportunity,
  UnifiedCategory,
  UnifiedDataSourceType,
  UnifiedOpportunity,
} from "./types";

const MS_PER_DAY = 86_400_000;

function parseIsoDayMs(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (!match) return null;
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(ms) ? null : ms;
}

function diffDays(targetIso: string | null, todayIso?: string): number | null {
  const targetMs = parseIsoDayMs(targetIso);
  const todayMs = parseIsoDayMs(todayIso);
  if (targetMs === null || todayMs === null) return null;
  return Math.round((targetMs - todayMs) / MS_PER_DAY);
}

const SOURCE_RANK_BONUS: Record<UnifiedDataSourceType, number> = {
  "OFFICIAL SOURCE": 18,
  "LIVE API": 16,
  "OFFICIAL DIRECTORY": 13,
  "VERIFIED INFORMATION": 10,
  CURATED: 6,
  "NEEDS VERIFICATION": 2,
  DEMO: -25,
};

function computeSectionTags(
  item: UnifiedOpportunity,
  matchPercentage: number,
  matchStatus: RankedUnifiedOpportunity["match"]["status"],
  isClosingSoon: boolean,
  isRecentlyAdded: boolean,
  profile: StudentProfile
): string[] {
  const tags: string[] = [];
  const active = matchStatus !== "closed" && matchStatus !== "ineligible";

  if (active && matchPercentage >= 55 && !item.isDemo) {
    tags.push("best_matches");
  }
  if (isClosingSoon && matchStatus !== "closed") {
    tags.push("closing_soon");
  }
  if (isRecentlyAdded && matchStatus !== "closed") {
    tags.push("recently_added");
  }
  if (item.category === "scholarship") {
    tags.push("scholarships_for_you");
  }
  if (
    item.category === "internship" ||
    item.category === "job" ||
    item.category === "research"
  ) {
    tags.push("build_your_career");
  }
  if (item.category === "hackathon" || item.category === "competition") {
    tags.push("build_your_portfolio");
  }
  if (item.category === "ambassador" || item.category === "fellowship") {
    tags.push("student_leadership");
  }

  // Explore beyond branch: active non-demo items that don't strictly match the student's branch
  const branchLower = (profile.branch || "").trim().toLowerCase();
  const hasBranchFilter =
    item.requiredBranches.length > 0 && branchLower.length > 0;
  const branchMatched =
    hasBranchFilter &&
    item.requiredBranches.some(
      (b) =>
        b.toLowerCase().includes(branchLower) ||
        branchLower.includes(b.toLowerCase())
    );
  if (
    active &&
    !item.isDemo &&
    ((hasBranchFilter && !branchMatched) ||
      (item.category === "hackathon" && item.beginnerFriendly))
  ) {
    tags.push("explore_beyond");
  }

  return tags;
}

export function rankUnifiedOpportunities(
  items: UnifiedOpportunity[],
  profile: StudentProfile,
  todayIso?: string
): RankedUnifiedOpportunity[] {
  const ranked = items.map((item): RankedUnifiedOpportunity => {
    const match = explainUnifiedMatch(profile, item, todayIso);
    const urgencyDays = diffDays(item.deadline, todayIso);
    const isClosingSoon =
      match.status !== "closed" &&
      urgencyDays !== null &&
      urgencyDays >= 0 &&
      urgencyDays <= 21;

    const ageDays = diffDays(item.publishedDate, todayIso);
    const isRecentlyAdded =
      (ageDays !== null && ageDays <= 0 && ageDays >= -14) ||
      (item.dataSourceType === "LIVE API" && match.status !== "closed");

    let score = match.percentage * 1.4;

    if (match.status === "closed") {
      score -= 1000;
    } else if (match.status === "ineligible") {
      score -= 220;
    }

    score += SOURCE_RANK_BONUS[item.dataSourceType] ?? 0;

    if (!item.isDemo) {
      score += 20;
    }

    if (item.indiaEligibility === "india_based") score += 18;
    else if (item.indiaEligibility === "accepts_india") score += 10;
    else if (item.indiaEligibility === "worldwide") score += 4;
    else if (item.indiaEligibility === "restricted_other") score -= 40;

    if (
      profile.preferredCategories &&
      profile.preferredCategories.some(
        (c) => c.toLowerCase() === item.category.toLowerCase()
      )
    ) {
      score += 12;
    }

    if (
      profile.preferredWorkMode &&
      profile.preferredWorkMode !== "Any" &&
      item.workMode.toLowerCase() === profile.preferredWorkMode.toLowerCase()
    ) {
      score += 8;
    }

    if (isClosingSoon && urgencyDays !== null) {
      score += urgencyDays <= 7 ? 16 : 10;
    }

    const sectionTags = computeSectionTags(
      item,
      match.percentage,
      match.status,
      isClosingSoon,
      isRecentlyAdded,
      profile
    );

    return {
      ...item,
      match,
      rankScore: Math.round(score * 10) / 10,
      urgencyDays,
      isClosingSoon,
      isRecentlyAdded,
      sectionTags,
    };
  });

  return ranked.sort((a, b) => {
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    if (b.match.percentage !== a.match.percentage) {
      return b.match.percentage - a.match.percentage;
    }
    return a.title.localeCompare(b.title);
  });
}

/**
 * Selects a diversified top feed for the Dashboard (e.g. 5 items across distinct categories).
 */
export function getDiversifiedDashboardFeed(
  ranked: RankedUnifiedOpportunity[],
  limit = 5
): RankedUnifiedOpportunity[] {
  const candidates = ranked.filter(
    (r) => r.match.status !== "closed" && r.match.status !== "ineligible"
  );
  const nonDemoCandidates = candidates.filter((r) => !r.isDemo);
  const pool = nonDemoCandidates.length >= limit ? nonDemoCandidates : candidates;

  const picked: RankedUnifiedOpportunity[] = [];
  const usedIds = new Set<string>();

  const desiredCategories: UnifiedCategory[] = [
    "scholarship",
    "internship",
    "job",
    "hackathon",
    "ambassador",
  ];

  // Pass 1: pick top item from each distinct category
  for (const cat of desiredCategories) {
    if (picked.length >= limit) break;
    const match = pool.find((item) => item.category === cat && !usedIds.has(item.id));
    if (match) {
      picked.push(match);
      usedIds.add(match.id);
    }
  }

  // Pass 2: fill remaining slots with highest ranked items
  for (const item of pool) {
    if (picked.length >= limit) break;
    if (!usedIds.has(item.id)) {
      picked.push(item);
      usedIds.add(item.id);
    }
  }

  return picked;
}

export interface ReadinessTip {
  field: string;
  tip: string;
}

export function getProfileReadinessTips(profile: StudentProfile): ReadinessTip[] {
  const tips: ReadinessTip[] = [];
  if (!profile.course) {
    tips.push({
      field: "course",
      tip: "Add your degree/course (e.g., B.Tech) to unlock accurate scholarship & internship filtering.",
    });
  }
  if (!profile.branch) {
    tips.push({
      field: "branch",
      tip: "Add your engineering branch (e.g., ECE, CSE) to surface domain-specific roles and VLSI/software tracks.",
    });
  }
  if (!profile.skills) {
    tips.push({
      field: "skills",
      tip: "List your technical skills (e.g., Verilog, Python, React) to improve internship, job, and hackathon scores.",
    });
  }
  if (!profile.state) {
    tips.push({
      field: "state",
      tip: "Select your domicile state (e.g., West Bengal) to surface state scholarships like SVMCM and Oasis.",
    });
  }
  if (!profile.annualIncome) {
    tips.push({
      field: "annualIncome",
      tip: "Add family income range to check means-based government and corporate scholarships.",
    });
  }
  if (!profile.institutionType) {
    tips.push({
      field: "institutionType",
      tip: "Specify Government, Aided, or Private institution type for scholarship eligibility checks.",
    });
  }
  return tips;
}
