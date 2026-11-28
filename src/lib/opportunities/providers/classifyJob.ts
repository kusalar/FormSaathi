import { ExperienceClassification, JobCategoryGroup } from "@/types";

const FRESHER_KEYWORDS = [
  "fresher",
  "freshers",
  "new grad",
  "graduate trainee",
  "graduate engineer trainee",
  "campus",
  "0-1 year",
  "0–1 year",
  "0 years",
  "management trainee",
];

const ENTRY_KEYWORDS = [
  "junior",
  "jr.",
  "entry level",
  "entry-level",
  "associate engineer",
  "trainee",
  "early career",
  "graduate",
];

const EXPERIENCED_KEYWORDS = [
  "senior",
  "sr.",
  "staff",
  "principal",
  "lead",
  "architect",
  "manager",
  "director",
  "head of",
  "mid-level",
  "3+ years",
  "4+ years",
  "5+ years",
  "7+ years",
  "10+ years",
];

export function classifyExperience(
  title: string,
  description: string,
  seniority: string[] = []
): ExperienceClassification {
  const titleLower = title.toLowerCase();
  const combined = `${title} ${description}`.toLowerCase();
  const senLower = seniority.map((s) => s.toLowerCase());

  if (FRESHER_KEYWORDS.some((k) => combined.includes(k))) {
    return "explicit_fresher";
  }
  if (
    senLower.some((s) => s.includes("mid") || s.includes("senior") || s.includes("lead")) ||
    EXPERIENCED_KEYWORDS.some((k) => titleLower.includes(k))
  ) {
    return "experience_required";
  }
  if (
    senLower.some((s) => s.includes("entry") || s.includes("junior")) ||
    ENTRY_KEYWORDS.some((k) => titleLower.includes(k))
  ) {
    return "entry_level";
  }
  if (/\b[2-9]\+?\s*years?\b/i.test(description)) {
    return "experience_required";
  }
  return "experience_unknown";
}

export function classifyJobCategoryGroup(text: string): JobCategoryGroup {
  const lower = text.toLowerCase();
  if (
    lower.includes("graduate engineer trainee") ||
    lower.includes("management trainee") ||
    lower.includes("graduate trainee") ||
    lower.includes("graduate programme") ||
    lower.includes("campus recruitment")
  ) {
    return "graduate_programme";
  }
  if (
    lower.includes("vlsi") ||
    lower.includes("rtl") ||
    lower.includes("physical design") ||
    lower.includes("design verification") ||
    lower.includes("embedded") ||
    lower.includes("fpga") ||
    lower.includes("semiconductor") ||
    lower.includes("electronics") ||
    lower.includes("signal processing") ||
    lower.includes("hardware") ||
    lower.includes("iot") ||
    lower.includes("telecom")
  ) {
    return "ece_electronics";
  }
  if (
    lower.includes("mechanical") ||
    lower.includes("civil") ||
    lower.includes("electrical") ||
    lower.includes("chemical") ||
    lower.includes("production engineer") ||
    lower.includes("quality engineer")
  ) {
    return "other_engineering";
  }
  return "software_it";
}
