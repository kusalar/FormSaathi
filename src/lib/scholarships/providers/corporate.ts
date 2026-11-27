import { NormalizedScholarship } from "@/types";
import { ScholarshipProvider, ScholarshipProviderResult } from "./types";

const VERIFIED_DATE = "2026-11-27";

export const CORPORATE_SCHOLARSHIPS: NormalizedScholarship[] = [
  {
    id: "corp-hdfc-parivartan-ecss",
    isDemo: false,
    title: "HDFC Bank Parivartan's Educational Crisis Scholarship Support (ECSS)",
    provider: "HDFC Bank Parivartan",
    description:
      "Corporate CSR scholarship supporting Indian students from Classes 1–12, Diploma, ITI, Polytechnic, UG, and PG courses facing personal/family financial crisis.",
    category: "Corporate",
    scholarshipType: "Corporate CSR / Need-Based",
    academicYear: "Check current cycle on parivartanecss.com",
    eligibleDegrees: ["B.Tech", "B.Sc", "B.Com", "B.A", "Diploma", "MBBS", "M.Sc", "M.Tech"],
    eligibleBranches: [],
    eligibleAcademicYears: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    eligibleGraduationYears: [],
    minAcademicPercentage: 55,
    maxIncomeLakh: 2.5,
    eligibleInstitutionTypes: ["Government", "Aided", "Private"],
    eligibleStates: [],
    eligibleLocations: ["All India"],
    specialConditions: [
      "Minimum 55% marks in previous qualifying examination",
      "Priority for students facing sudden family/financial crisis in last 3 years",
      "100% free application — beware of any third party charging fees",
    ],
    amountLabel: "₹30,000 (UG Gen) / ₹50,000 (UG Prof) / up to ₹75,000 (PG Prof)",
    benefitType: "Annual Tuition / Academic Support",
    duration: "1 Year (Check renewal rules)",
    openingDate: null,
    deadline: null,
    applicationUrl: "https://www.parivartanecss.com/",
    officialSourceUrl: "https://www.parivartanecss.com/",
    sourceName: "HDFC Bank Parivartan ECSS",
    dataSourceType: "VERIFIED INFORMATION",
    applicationStatus: "UNVERIFIED",
    freshVsRenewalNote:
      "Verify current academic year application deadline directly on parivartanecss.com.",
    publishedDate: null,
    lastVerifiedAt: VERIFIED_DATE,
    lastFetchedAt: VERIFIED_DATE,
    verificationNotes:
      "Eligibility (55% marks, ≤₹2.5L income, UG/PG slabs) verified; current cycle deadline must be checked on parivartanecss.com.",
    requiredDocuments: [
      "Previous qualifying marksheet",
      "Family income proof",
      "Current year admission / fee receipt",
      "Proof of family/personal crisis (if applicable)",
    ],
  },
  {
    id: "corp-reliance-foundation",
    isDemo: false,
    title: "Reliance Foundation Undergraduate & Postgraduate Scholarships",
    provider: "Reliance Foundation",
    description:
      "Merit-cum-means corporate foundation scholarship supporting undergraduate students across streams and postgraduate students in AI, CS, Electrical, Electronics, and Engineering.",
    category: "Corporate",
    scholarshipType: "Foundation Merit-cum-Means",
    academicYear: "Check current cycle on scholarships.reliancefoundation.org",
    eligibleDegrees: ["B.Tech", "B.Sc", "B.Com", "B.A", "M.Tech", "M.Sc"],
    eligibleBranches: ["CSE", "ECE", "Electrical", "Mechanical", "IT", "AI"],
    eligibleAcademicYears: ["1st Year"],
    eligibleGraduationYears: [],
    minAcademicPercentage: null,
    maxIncomeLakh: null,
    eligibleInstitutionTypes: ["Government", "Aided", "Private"],
    eligibleStates: [],
    eligibleLocations: ["All India"],
    specialConditions: [
      "1st year regular UG/PG students (check exact income & aptitude test rules on official portal)",
      "No application fee",
    ],
    amountLabel: "Check official Reliance Foundation portal",
    benefitType: "Merit-cum-Means Grant + Alumni Network",
    duration: "Degree Duration",
    openingDate: null,
    deadline: null,
    applicationUrl: "https://scholarships.reliancefoundation.org/",
    officialSourceUrl: "https://scholarships.reliancefoundation.org/",
    sourceName: "Reliance Foundation Scholarships",
    dataSourceType: "OFFICIAL SOURCE",
    applicationStatus: "UNVERIFIED",
    freshVsRenewalNote:
      "Typically open to 1st-year entrants; check exact cycle opening & deadline on scholarships.reliancefoundation.org.",
    publishedDate: null,
    lastVerifiedAt: VERIFIED_DATE,
    lastFetchedAt: VERIFIED_DATE,
    verificationNotes:
      "Official outbound portal; verify current cycle eligibility and deadlines directly on scholarships.reliancefoundation.org.",
    requiredDocuments: [
      "Class 12 / UG marksheet",
      "College enrollment proof",
      "Family income proof",
    ],
  },
];

export const CorporateScholarshipProvider: ScholarshipProvider = {
  id: "corporate-official",
  name: "Corporate & Foundation Scholarships (HDFC Parivartan, Reliance Foundation)",
  sourceUrl: "https://www.parivartanecss.com/",
  async fetchScholarships(): Promise<ScholarshipProviderResult> {
    const now = new Date().toISOString().slice(0, 10);
    return {
      ok: true,
      providerId: "corporate-official",
      providerName: "Corporate & Foundation Scholarships (HDFC Parivartan, Reliance Foundation)",
      sourceUrl: "https://www.parivartanecss.com/",
      dataSourceType: "VERIFIED INFORMATION",
      fetchedAt: now,
      scholarships: CORPORATE_SCHOLARSHIPS,
    };
  },
};
