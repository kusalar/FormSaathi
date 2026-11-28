import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type {
  NormalizedScholarship,
  Opportunity,
  StudentProfile,
} from "../src/types";
import { matchNormalizedScholarship } from "../src/lib/scholarships/matcher";
import { classifyEngineeringDomain } from "../src/lib/opportunities/providers/classify";
import {
  classifyExperience,
  classifyJobCategoryGroup,
} from "../src/lib/opportunities/providers/classifyJob";
import { matchCompetition } from "../src/lib/opportunities/competitions/matcher";
import {
  normalizeOpportunityToUnified,
  normalizeScholarshipToUnified,
} from "../src/lib/opportunities/unified/normalize";
import { deduplicateUnifiedOpportunities } from "../src/lib/opportunities/unified/deduplicate";
import {
  getDiversifiedDashboardFeed,
  rankUnifiedOpportunities,
} from "../src/lib/opportunities/unified/rank";
import { sanitizeRedirectPath } from "../src/lib/supabase/redirect";

const sampleEceProfile: StudentProfile = {
  name: "Aarav",
  course: "B.Tech",
  branch: "ECE",
  year: "3rd Year",
  graduationYear: "2027",
  institutionType: "Government",
  annualIncome: "Below ₹2.5 Lakh",
  state: "West Bengal",
  category: "General",
  firstGen: true,
  skills: "Verilog, Embedded Systems, Python",
  preferredCategories: ["internship", "scholarship"],
  preferredWorkMode: "Remote",
};

const emptyProfile: StudentProfile = {
  name: "",
  course: "",
  branch: "",
  year: "",
  institutionType: "",
  annualIncome: "",
  state: "",
  category: "",
  firstGen: false,
  skills: "",
};

const baseScholarship: NormalizedScholarship = {
  id: "sch-wb-svmcm",
  isDemo: false,
  title: "SVMCM Scholarship (West Bengal)",
  provider: "Government of West Bengal",
  description: "Merit-cum-means scholarship for West Bengal students.",
  category: "West Bengal",
  scholarshipType: "State Government",
  academicYear: "2026-27",
  eligibleDegrees: ["B.Tech", "B.Sc"],
  eligibleBranches: [],
  eligibleAcademicYears: ["2nd Year", "3rd Year"],
  eligibleGraduationYears: [],
  minAcademicPercentage: 60,
  maxIncomeLakh: 2.5,
  eligibleInstitutionTypes: ["Government", "Aided"],
  eligibleStates: ["West Bengal"],
  eligibleLocations: [],
  specialConditions: ["Minimum 60% marks in qualifying examination"],
  amountLabel: "₹60,000 / year",
  benefitType: "Annual Tuition & Stipend",
  duration: "1 Year",
  openingDate: "2026-08-01",
  deadline: "2026-12-31",
  applicationUrl: "https://svmcm.wbhed.gov.in/",
  officialSourceUrl: "https://svmcm.wbhed.gov.in/",
  sourceName: "SVMCM Official Portal",
  dataSourceType: "OFFICIAL SOURCE",
  applicationStatus: "OPEN",
  freshVsRenewalNote: "Fresh & Renewal",
  publishedDate: "2026-08-01",
  lastVerifiedAt: "2026-11-01",
  lastFetchedAt: "2026-11-28T00:00:00.000Z",
  verificationNotes: "Verify domicile and marks on SVMCM portal.",
  requiredDocuments: ["Income Certificate", "Marksheet"],
};

const baseOpportunity: Opportunity = {
  id: "opp-vlsi-1",
  isDemo: false,
  title: "VLSI RTL Design Intern",
  organisation: "SemiCore India",
  category: "internship",
  description: "Work on Verilog and FPGA prototyping.",
  eligibilityCriteria: "B.Tech ECE/EEE students",
  requiredDegrees: ["B.Tech"],
  requiredBranches: ["ECE", "EEE"],
  eligibleYears: ["3rd Year", "4th Year"],
  requiredSkills: ["Verilog", "FPGA"],
  minGradYear: null,
  maxGradYear: null,
  minIncomeLakh: null,
  maxIncomeLakh: null,
  institutionTypes: [],
  location: "Bengaluru, India",
  workMode: "Remote",
  stipendOrSalary: "₹25,000/month",
  deadline: "2026-12-15",
  applicationUrl: "https://example.org/jobs/vlsi-intern?utm_source=test",
  sourceName: "Himalayas",
  sourceUrl: "https://himalayas.app",
  datePublished: "2026-11-20",
  lastVerifiedAt: "2026-11-28",
  status: "active",
  sourceBadge: "LIVE API",
  indiaEligibility: "india_based",
  engineeringDomain: "ece_vlsi",
};

describe("Phase 6.0 Critical Logic Suite", () => {
  it("1. Scholarship matching evaluates eligible & ineligible profiles accurately", () => {
    const match = matchNormalizedScholarship(
      sampleEceProfile,
      baseScholarship,
      "2026-11-28"
    );
    assert.ok(match.percentage >= 70);
    assert.ok(
      match.status === "INDICATIVE_MATCH" || match.status === "NEEDS_VERIFICATION"
    );
    assert.ok(match.satisfied.length > 0);

    const otherState = { ...sampleEceProfile, state: "Maharashtra" };
    const failMatch = matchNormalizedScholarship(
      otherState,
      baseScholarship,
      "2026-11-28"
    );
    assert.equal(failMatch.status, "NOT_ELIGIBLE");
    assert.ok(failMatch.percentage <= 30);
  });

  it("2. Internship & job classification detects ECE/VLSI, Software, and Fresher roles", () => {
    assert.equal(
      classifyEngineeringDomain("RTL Design Verification Engineer Verilog FPGA"),
      "ece_vlsi"
    );
    assert.equal(
      classifyEngineeringDomain("Full Stack React Node.js TypeScript Developer"),
      "cse_software"
    );
    assert.equal(
      classifyExperience("Graduate Engineer Trainee - Freshers 2026", "0-1 year experience"),
      "explicit_fresher"
    );
    assert.equal(
      classifyJobCategoryGroup("Physical Design VLSI Engineer"),
      "ece_electronics"
    );
  });

  it("3. Competition matching scores India-eligible hackathons and marks verification needs", () => {
    const comp: Opportunity = {
      ...baseOpportunity,
      id: "comp-sih-1",
      title: "Smart India Hackathon 2026",
      organisation: "Ministry of Education",
      category: "hackathon",
      competitionSubCategory: "hackathon",
      requiredBranches: [],
      requiredSkills: ["Python"],
      beginnerFriendly: true,
      sourceBadge: "OFFICIAL DIRECTORY",
    };
    const res = matchCompetition(sampleEceProfile, comp, "2026-11-28");
    assert.ok(res.percentage >= 60);
    assert.ok(
      res.eligibilityStatus === "eligible" ||
        res.eligibilityStatus === "needs_verification"
    );
  });

  it("4. Unified normalization converts both NormalizedScholarship and Opportunity", () => {
    const uSch = normalizeScholarshipToUnified(baseScholarship);
    assert.equal(uSch.category, "scholarship");
    assert.equal(uSch.dataSourceType, "OFFICIAL SOURCE");
    assert.equal(uSch.isDemo, false);

    const uOpp = normalizeOpportunityToUnified(baseOpportunity);
    assert.equal(uOpp.category, "internship");
    assert.equal(uOpp.dataSourceType, "LIVE API");
  });

  it("5. Unified deduplication merges duplicate title+org and keeps higher-trust non-demo record", () => {
    const demoCopy = normalizeOpportunityToUnified({
      ...baseOpportunity,
      id: "demo-copy",
      isDemo: true,
      sourceBadge: "DEMO",
      description: "Short",
      deadline: null,
    });
    const liveCopy = normalizeOpportunityToUnified(baseOpportunity);

    const { items, removedCount } = deduplicateUnifiedOpportunities([
      demoCopy,
      liveCopy,
    ]);
    assert.equal(removedCount, 1);
    assert.equal(items.length, 1);
    assert.equal(items[0].id, "opp-vlsi-1");
    assert.equal(items[0].isDemo, false);
  });

  it("6. Unified ranking prioritizes active real matches over closed/demo and diversifies feed", () => {
    const uSch = normalizeScholarshipToUnified(baseScholarship);
    const uOpp = normalizeOpportunityToUnified(baseOpportunity);
    const closedOpp = normalizeOpportunityToUnified({
      ...baseOpportunity,
      id: "closed-1",
      title: "Old Closed Role",
      deadline: "2025-01-01",
      status: "expired",
    });

    const ranked = rankUnifiedOpportunities(
      [closedOpp, uOpp, uSch],
      sampleEceProfile,
      "2026-11-28"
    );
    assert.equal(ranked[ranked.length - 1].id, "closed-1");
    assert.equal(ranked[ranked.length - 1].match.status, "closed");

    const feed = getDiversifiedDashboardFeed(ranked, 5);
    assert.ok(feed.every((item) => item.match.status !== "closed"));
  });

  it("7. Expired opportunity handling returns closed/0%", () => {
    const expiredSch = {
      ...baseScholarship,
      deadline: "2025-10-01",
    };
    const res = matchNormalizedScholarship(
      sampleEceProfile,
      expiredSch,
      "2026-11-28"
    );
    assert.equal(res.status, "CLOSED");
    assert.equal(res.percentage, 0);
  });

  it("8. Missing profile fields trigger needs_information / needs_verification instead of false eligible", () => {
    const uSch = normalizeScholarshipToUnified(baseScholarship);
    const ranked = rankUnifiedOpportunities([uSch], emptyProfile, "2026-11-28");
    assert.ok(
      ranked[0].match.status === "needs_information" ||
        ranked[0].match.status === "needs_verification"
    );
    assert.ok(ranked[0].match.verificationNeeded.length > 0);
  });

  it("9. Authentication redirect sanitization prevents open redirects", () => {
    assert.equal(sanitizeRedirectPath("/recommendations?section=closing_soon"), "/recommendations?section=closing_soon");
    assert.equal(sanitizeRedirectPath("https://evil.com"), "/profile");
    assert.equal(sanitizeRedirectPath("//evil.com"), "/profile");
    assert.equal(sanitizeRedirectPath("/\\evil.com"), "/profile");
    assert.equal(sanitizeRedirectPath("/%2fevil.com"), "/profile");
    assert.equal(sanitizeRedirectPath("/profile\r\nLocation: https://evil.com"), "/profile");
    assert.equal(sanitizeRedirectPath(null), "/profile");
  });
});
