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

export type SourceBadgeType =
  | "LIVE API"
  | "OFFICIAL SOURCE"
  | "OFFICIAL DIRECTORY"
  | "CURATED"
  | "DEMONSTRATION"
  | "NEEDS VERIFICATION"
  | "DEMO";

export type IndiaEligibilityType =
  | "india_based"
  | "accepts_india"
  | "worldwide"
  | "location_unknown"
  | "restricted_other";

export type EngineeringDomainType =
  | "ece_vlsi"
  | "cse_software"
  | "research"
  | "general_engineering"
  | "other";

export type ApplicationStatusLabel =
  | "Open"
  | "Upcoming"
  | "Closed"
  | "Unverified";

export type ExperienceClassification =
  | "explicit_fresher"
  | "entry_level"
  | "experience_required"
  | "experience_unknown";

export type JobCategoryGroup =
  | "software_it"
  | "ece_electronics"
  | "other_engineering"
  | "graduate_programme";

export type CompetitionSubCategory =
  | "hackathon"
  | "coding_competition"
  | "innovation_challenge"
  | "student_ambassador"
  | "fellowship"
  | "entrepreneurship"
  | "research_competition"
  | "design_competition"
  | "other";

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
  sourceBadge?: SourceBadgeType;
  indiaEligibility?: IndiaEligibilityType;
  engineeringDomain?: EngineeringDomainType;
  applicationStatusLabel?: ApplicationStatusLabel;
  companyLogo?: string | null;
  experienceClassification?: ExperienceClassification;
  jobCategoryGroup?: JobCategoryGroup;
  salaryCurrency?: string | null;
  seniorityLabels?: string[];
  competitionSubCategory?: CompetitionSubCategory;
  teamSizeLabel?: string | null;
  prizeOrReward?: string | null;
  participationFee?: string | null;
  eventDatesLabel?: string | null;
  beginnerFriendly?: boolean;
}

export interface ApplicationTrackingItem {
  opportunityId: string;
  opportunityTitle: string;
  status: ApplicationTrackingStatus;
  notes: string;
  updatedAt: string;
}

export type DataSourceType =
  | "LIVE API"
  | "OFFICIAL SOURCE"
  | "VERIFIED INFORMATION"
  | "NEEDS VERIFICATION"
  | "DEMO";

export type ScholarshipApplicationStatus =
  | "OPEN"
  | "UPCOMING"
  | "CLOSED"
  | "UNVERIFIED"
  | "INFORMATION_ONLY";

export type ScholarshipGroupCategory =
  | "Government"
  | "State"
  | "West Bengal"
  | "Corporate"
  | "Engineering"
  | "Merit"
  | "Need-Based"
  | "Women in STEM"
  | "Research"
  | "First-Gen";

export interface NormalizedScholarship {
  id: string;
  isDemo: boolean;
  title: string;
  provider: string;
  description: string;
  category: ScholarshipGroupCategory;
  scholarshipType: string;
  academicYear: string;
  eligibleDegrees: string[];
  eligibleBranches: string[];
  eligibleAcademicYears: string[];
  eligibleGraduationYears: string[];
  minAcademicPercentage: number | null;
  maxIncomeLakh: number | null;
  eligibleInstitutionTypes: string[];
  eligibleStates: string[];
  eligibleLocations: string[];
  specialConditions: string[];
  amountLabel: string;
  benefitType: string;
  duration: string;
  openingDate: string | null;
  deadline: string | null;
  applicationUrl: string | null;
  officialSourceUrl: string;
  sourceName: string;
  dataSourceType: DataSourceType;
  applicationStatus: ScholarshipApplicationStatus;
  freshVsRenewalNote: string;
  publishedDate: string | null;
  lastVerifiedAt: string;
  lastFetchedAt: string;
  verificationNotes: string;
  requiredDocuments: string[];
}

export interface ActivityItem {
  id: string;
  label: LocalizedText;
  timestamp: string;
  href: string;
}
