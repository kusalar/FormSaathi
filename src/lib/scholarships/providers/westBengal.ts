import { NormalizedScholarship } from "@/types";
import { ScholarshipProvider, ScholarshipProviderResult } from "./types";

const VERIFIED_DATE = "2026-11-27";

export const WEST_BENGAL_SCHOLARSHIPS: NormalizedScholarship[] = [
  {
    id: "wb-svmcm",
    isDemo: false,
    title: "Swami Vivekananda Merit-cum-Means Scholarship (SVMCM)",
    provider: "Higher Education Department, Government of West Bengal",
    description:
      "Flagship West Bengal state merit-cum-means scholarship (Bikash Bhavan Scholarship) supporting HS, UG, PG, Diploma, and Doctoral students.",
    category: "West Bengal",
    scholarshipType: "State Merit-cum-Means",
    academicYear: "Check current cycle on svmcm.wb.gov.in",
    eligibleDegrees: ["B.Tech", "B.Sc", "B.Com", "B.A", "Diploma", "MBBS", "M.Sc", "M.Tech"],
    eligibleBranches: [],
    eligibleAcademicYears: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    eligibleGraduationYears: [],
    minAcademicPercentage: 60,
    maxIncomeLakh: 2.5,
    eligibleInstitutionTypes: ["Government", "Aided", "Private"],
    eligibleStates: ["West Bengal"],
    eligibleLocations: ["West Bengal"],
    specialConditions: [
      "Permanent resident (domicile) of West Bengal",
      "Minimum 60% marks in qualifying exam (general guideline; verify course-specific cutoffs on portal)",
    ],
    amountLabel: "₹1,000 – ₹8,000 / month (course-dependent)",
    benefitType: "Monthly Scholarship (DBT)",
    duration: "Course Duration (Fresh & Renewal)",
    openingDate: null,
    deadline: null,
    applicationUrl: "https://svmcm.wb.gov.in/",
    officialSourceUrl: "https://svmcm.wb.gov.in/",
    sourceName: "SVMCM Official Portal",
    dataSourceType: "VERIFIED INFORMATION",
    applicationStatus: "UNVERIFIED",
    freshVsRenewalNote:
      "Fresh and Renewal applications are submitted on svmcm.wb.gov.in; check whether the current academic year window is open.",
    publishedDate: null,
    lastVerifiedAt: VERIFIED_DATE,
    lastFetchedAt: VERIFIED_DATE,
    verificationNotes:
      "Core eligibility (WB domicile, ≤₹2.5L income, 60% qualifying marks) verified; current-year open/close dates must be checked on svmcm.wb.gov.in.",
    requiredDocuments: [
      "Qualifying exam marksheet",
      "West Bengal domicile / residence proof",
      "Family income certificate",
      "College admission / fee receipt",
    ],
  },
  {
    id: "wb-aikyashree",
    isDemo: false,
    title: "WBMDFC Aikyashree Scholarship (Minority Communities)",
    provider: "West Bengal Minorities' Development & Finance Corporation",
    description:
      "Official West Bengal state scholarship programme (Pre-Matric, Post-Matric, Merit-cum-Means, and TSP) for students from notified minority communities.",
    category: "West Bengal",
    scholarshipType: "State Minority Welfare",
    academicYear: "Check current cycle on wbmdfcscholarship.in",
    eligibleDegrees: ["B.Tech", "B.Sc", "B.Com", "B.A", "Diploma", "MBBS", "M.Sc", "M.Tech"],
    eligibleBranches: [],
    eligibleAcademicYears: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    eligibleGraduationYears: [],
    minAcademicPercentage: 50,
    maxIncomeLakh: 2.5,
    eligibleInstitutionTypes: ["Government", "Aided", "Private"],
    eligibleStates: ["West Bengal"],
    eligibleLocations: ["West Bengal"],
    specialConditions: [
      "West Bengal domicile",
      "Notified minority community (Muslim, Christian, Buddhist, Sikh, Jain, Parsi) — not assumed by FormSaathi",
    ],
    amountLabel: "Scheme-specific (Post-Matric / Merit-cum-Means)",
    benefitType: "Tuition & Maintenance Allowance",
    duration: "Annual / Renewable",
    openingDate: null,
    deadline: null,
    applicationUrl: "https://www.wbmdfcscholarship.in/",
    officialSourceUrl: "https://www.wbmdfcscholarship.in/",
    sourceName: "WBMDFC Aikyashree Portal",
    dataSourceType: "OFFICIAL SOURCE",
    applicationStatus: "UNVERIFIED",
    freshVsRenewalNote:
      "Separate Fresh and Renewal forms; verify your specific sub-scheme (Post-Matric vs Merit-cum-Means) on wbmdfcscholarship.in.",
    publishedDate: null,
    lastVerifiedAt: VERIFIED_DATE,
    lastFetchedAt: VERIFIED_DATE,
    verificationNotes:
      "FormSaathi does not assume religion or community; verify sub-scheme income limits and dates directly on wbmdfcscholarship.in.",
    requiredDocuments: [
      "Previous final exam marksheet",
      "Family income certificate",
      "Institute verification form",
    ],
  },
  {
    id: "wb-oasis",
    isDemo: false,
    title: "OASIS Scholarship Portal (SC / ST / OBC — West Bengal)",
    provider: "Backward Classes Welfare Department, Government of West Bengal",
    description:
      "Official West Bengal portal for Pre-Matric and Post-Matric scholarships for Scheduled Caste (SC), Scheduled Tribe (ST), and Other Backward Classes (OBC) students.",
    category: "West Bengal",
    scholarshipType: "State SC / ST / OBC Welfare",
    academicYear: "Check current cycle on oasis.gov.in",
    eligibleDegrees: ["B.Tech", "B.Sc", "B.Com", "B.A", "Diploma", "MBBS", "M.Sc", "M.Tech"],
    eligibleBranches: [],
    eligibleAcademicYears: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    eligibleGraduationYears: [],
    minAcademicPercentage: null,
    maxIncomeLakh: 2.5,
    eligibleInstitutionTypes: ["Government", "Aided", "Private"],
    eligibleStates: ["West Bengal"],
    eligibleLocations: ["West Bengal"],
    specialConditions: [
      "West Bengal domicile",
      "Valid SC / ST / OBC certificate issued by West Bengal authority — not assumed by FormSaathi",
    ],
    amountLabel: "Post-Matric / Pre-Matric rates per WB norms",
    benefitType: "Maintenance & Fee Reimbursement",
    duration: "Annual / Renewable",
    openingDate: null,
    deadline: null,
    applicationUrl: "https://oasis.gov.in/",
    officialSourceUrl: "https://oasis.gov.in/",
    sourceName: "OASIS West Bengal Portal",
    dataSourceType: "OFFICIAL SOURCE",
    applicationStatus: "UNVERIFIED",
    freshVsRenewalNote:
      "Income ceiling differs for SC/ST vs OBC schemes; verify current dates and category limits on oasis.gov.in.",
    publishedDate: null,
    lastVerifiedAt: VERIFIED_DATE,
    lastFetchedAt: VERIFIED_DATE,
    verificationNotes:
      "FormSaathi never assumes caste category; verify eligibility and dates directly on oasis.gov.in.",
    requiredDocuments: [
      "Valid WB SC / ST / OBC certificate",
      "Family income certificate",
      "Previous marksheet & fee receipt",
    ],
  },
];

export const WestBengalScholarshipProvider: ScholarshipProvider = {
  id: "west-bengal-official",
  name: "West Bengal Government Portals (SVMCM, Aikyashree, OASIS)",
  sourceUrl: "https://svmcm.wb.gov.in/",
  async fetchScholarships(): Promise<ScholarshipProviderResult> {
    const now = new Date().toISOString().slice(0, 10);
    return {
      ok: true,
      providerId: "west-bengal-official",
      providerName: "West Bengal Government Portals (SVMCM, Aikyashree, OASIS)",
      sourceUrl: "https://svmcm.wb.gov.in/",
      dataSourceType: "OFFICIAL SOURCE",
      fetchedAt: now,
      scholarships: WEST_BENGAL_SCHOLARSHIPS,
    };
  },
};
