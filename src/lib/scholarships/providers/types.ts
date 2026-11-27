import { NormalizedScholarship } from "@/types";

export interface ScholarshipProviderResult {
  ok: boolean;
  providerId: string;
  providerName: string;
  sourceUrl: string;
  dataSourceType: "OFFICIAL SOURCE" | "VERIFIED INFORMATION" | "DEMO";
  fetchedAt: string;
  scholarships: NormalizedScholarship[];
  error?: string;
}

export interface ScholarshipProvider {
  id: string;
  name: string;
  sourceUrl: string;
  fetchScholarships: () => Promise<ScholarshipProviderResult>;
}
