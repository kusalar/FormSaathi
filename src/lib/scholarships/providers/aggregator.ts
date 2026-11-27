import { SCHOLARSHIPS } from "@/lib/scholarships";
import { NormalizedScholarship, ScholarshipGroupCategory } from "@/types";
import { CorporateScholarshipProvider } from "./corporate";
import { NationalScholarshipProvider } from "./national";
import { ScholarshipProviderResult } from "./types";
import { WestBengalScholarshipProvider } from "./westBengal";

export function mapDemoScholarships(): NormalizedScholarship[] {
  const catMap: Record<string, ScholarshipGroupCategory> = {
    Merit: "Merit",
    STEM: "Engineering",
    State: "State",
    Means: "Need-Based",
    "First-Gen": "First-Gen",
  };

  return SCHOLARSHIPS.map((s) => ({
    id: s.id,
    isDemo: true,
    title: s.name.en,
    provider: s.provider.en,
    description: s.summary.en,
    category: catMap[s.category] || "Merit",
    scholarshipType: "Demonstration Practice Scheme",
    academicYear: "Demo Cycle",
    eligibleDegrees: s.eligibilityCriteria.courses,
    eligibleBranches: [],
    eligibleAcademicYears: s.eligibilityCriteria.years,
    eligibleGraduationYears: [],
    minAcademicPercentage: null,
    maxIncomeLakh: s.eligibilityCriteria.maxIncomeLakh,
    eligibleInstitutionTypes: s.eligibilityCriteria.institutionTypes,
    eligibleStates: s.eligibilityCriteria.states,
    eligibleLocations:
      s.eligibilityCriteria.states.length > 0
        ? s.eligibilityCriteria.states
        : ["All India"],
    specialConditions:
      s.category === "First-Gen" ? ["First-generation college learner (Demo)"] : [],
    amountLabel: s.amountLabel.en,
    benefitType: "Simulated Support",
    duration: "Demo Practice",
    openingDate: null,
    deadline: null,
    applicationUrl: null,
    officialSourceUrl: "https://scholarships.gov.in/",
    sourceName: "FormSaathi Demo Catalog",
    dataSourceType: "DEMO",
    applicationStatus: "INFORMATION_ONLY",
    freshVsRenewalNote: s.verifiedPortalNote.en,
    publishedDate: null,
    lastVerifiedAt: "2026-11-27",
    lastFetchedAt: "2026-11-27",
    verificationNotes: s.verifiedPortalNote.en,
    requiredDocuments: s.requiredDocuments.map((d) => d.label.en),
  }));
}

export interface ScholarshipProviderStatus {
  id: string;
  name: string;
  ok: boolean;
  dataSourceType: string;
  count: number;
  fetchedAt: string;
  error?: string;
}

export interface AggregatedScholarshipsResponse {
  ok: boolean;
  scholarships: NormalizedScholarship[];
  providers: ScholarshipProviderStatus[];
  fetchedAt: string;
}

function deduplicateScholarships(
  items: NormalizedScholarship[]
): NormalizedScholarship[] {
  const seen = new Set<string>();
  const out: NormalizedScholarship[] = [];
  for (const item of items) {
    const key = `${item.id}::${item.title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export async function fetchAllScholarships(): Promise<AggregatedScholarshipsResponse> {
  const settled = await Promise.allSettled([
    NationalScholarshipProvider.fetchScholarships(),
    WestBengalScholarshipProvider.fetchScholarships(),
    CorporateScholarshipProvider.fetchScholarships(),
  ]);

  const providers: ScholarshipProviderStatus[] = [];
  const collected: NormalizedScholarship[] = [];

  for (const item of settled) {
    if (item.status === "fulfilled") {
      const res: ScholarshipProviderResult = item.value;
      providers.push({
        id: res.providerId,
        name: res.providerName,
        ok: res.ok,
        dataSourceType: res.dataSourceType,
        count: res.scholarships.length,
        fetchedAt: res.fetchedAt,
        error: res.error,
      });
      if (res.ok) {
        collected.push(...res.scholarships);
      }
    } else {
      providers.push({
        id: "unknown-provider",
        name: "Scholarship Provider",
        ok: false,
        dataSourceType: "OFFICIAL SOURCE",
        count: 0,
        fetchedAt: new Date().toISOString().slice(0, 10),
        error: "Provider failed unexpectedly.",
      });
    }
  }

  const demos = mapDemoScholarships();
  providers.push({
    id: "demo-catalog",
    name: "FormSaathi Demonstration Scholarships",
    ok: true,
    dataSourceType: "DEMO",
    count: demos.length,
    fetchedAt: "2026-11-27",
  });

  const all = deduplicateScholarships([...collected, ...demos]);

  return {
    ok: providers.some((p) => p.ok),
    scholarships: all,
    providers,
    fetchedAt: new Date().toISOString(),
  };
}
