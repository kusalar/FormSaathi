import { CompetitionSubCategory } from "@/types";

export function classifyCompetitionSubCategory(
  text: string,
  themes: string[] = []
): CompetitionSubCategory {
  const combined = `${text} ${themes.join(" ")}`.toLowerCase();
  if (combined.includes("ambassador") || combined.includes("campus representative") || combined.includes("cloud club")) {
    return "student_ambassador";
  }
  if (combined.includes("fellowship")) return "fellowship";
  if (combined.includes("research")) return "research_competition";
  if (combined.includes("entrepreneur") || combined.includes("startup")) {
    return "entrepreneurship";
  }
  if (combined.includes("design") || combined.includes("ui/ux")) {
    return "design_competition";
  }
  if (combined.includes("coding") || combined.includes("competitive programming") || combined.includes("algorithm")) {
    return "coding_competition";
  }
  if (combined.includes("innovation") || combined.includes("smart india")) {
    return "innovation_challenge";
  }
  if (combined.includes("hackathon") || combined.includes("hack")) {
    return "hackathon";
  }
  return "other";
}

export function isCompetitionBeginnerFriendly(
  text: string,
  themes: string[] = []
): boolean {
  const combined = `${text} ${themes.join(" ")}`.toLowerCase();
  return (
    combined.includes("beginner friendly") ||
    combined.includes("beginner-friendly") ||
    combined.includes("no prior experience")
  );
}
