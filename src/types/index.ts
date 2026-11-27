export type Language = "en" | "hi" | "bn";

export interface LocalizedText {
  en: string;
  hi: string;
  bn: string;
}

export interface StudentProfile {
  name: string;
  collegeName?: string;
  course: string;
  branch?: string;
  year: string;
  graduationYear?: string;
  institutionType: "Government" | "Private" | "Aided" | "";
  annualIncome: string; // e.g. "Below ₹2.5 Lakh", "₹2.5L - ₹5L", "₹5L - ₹8L", "Above ₹8L"
  state: string;
  category: "General" | "OBC" | "SC" | "ST" | "EWS" | "";
  firstGen: boolean;
  skills?: string;
  preferredCategories?: string[];
  preferredWorkMode?: "Remote" | "Hybrid" | "On-site" | "Any" | "";
}

export interface DocumentItem {
  id: string;
  label: LocalizedText;
  tip: LocalizedText;
  required: boolean;
}

export type ScholarshipCategory = "Merit" | "STEM" | "State" | "Means" | "First-Gen";

export interface Scholarship {
  id: string;
  isDemo: true;
  name: LocalizedText;
  provider: LocalizedText;
  category: ScholarshipCategory;
  amountLabel: LocalizedText;
  deadlineLabel: LocalizedText;
  summary: LocalizedText;
  verifiedPortalUrl: string | null;
  verifiedPortalNote: LocalizedText;
  eligibilityCriteria: {
    courses: string[]; // empty means any
    years: string[]; // empty means any
    institutionTypes: string[]; // empty means any
    maxIncomeLakh: number | null;
    states: string[]; // empty means all India
  };
  requiredDocuments: DocumentItem[];
  applicationSteps: LocalizedText[];
}

export interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  lang: Language;
  confirmation?: {
    field: keyof StudentProfile;
    value: string;
    label: string;
    confirmed?: boolean;
  };
  actions?: Array<{
    label: string;
    href?: string;
    promptText?: string;
  }>;
  matchedScholarships?: Array<{
    id: string;
    name: string;
    amount: string;
    reasons: string[];
  }>;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: "success" | "info" | "warning";
}

export type OpportunityCategory =
  | "scholarship"
  | "internship"
  | "job"
  | "hackathon"
  | "research"
  | "ambassador"
  | "competition"
  | "fellowship";

export type WorkMode = "Remote" | "Hybrid" | "On-site";

export type OpportunityStatus = "active" | "expired";

export type ApplicationTrackingStatus =
  | "interested"
  | "applied"
  | "interview"
  | "selected"
  | "rejected";

export interface Opportunity {
  id: string;
  isDemo: boolean;
  title: string;
  organisation: string;
  category: OpportunityCategory;
  description: string;
  eligibilityCriteria: string;
  requiredDegrees: string[];
  requiredBranches: string[];
  eligibleYears: string[];
  requiredSkills: string[];
  minGradYear: number | null;
  maxGradYear: number | null;
  minIncomeLakh: number | null;
  maxIncomeLakh: number | null;
  institutionTypes: string[];
  location: string;
  workMode: WorkMode;
  stipendOrSalary: string;
  deadline: string | null; // YYYY-MM-DD
  applicationUrl: string | null;
  sourceName: string;
  sourceUrl: string | null;
  datePublished: string | null;
  lastVerifiedAt: string;
  status: OpportunityStatus;
  experienceRequired?: string;
  employmentType?: string;
  locationRestrictions?: string[];
  hasAcademicCriteria?: boolean;
  lastFetchedAt?: string;
}

export interface ApplicationTrackingItem {
  opportunityId: string;
  opportunityTitle: string;
  status: ApplicationTrackingStatus;
  notes: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  label: LocalizedText;
  timestamp: string;
  href: string;
}
