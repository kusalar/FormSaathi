import { Opportunity } from "@/types";

export interface InternshipSearchParams {
  query?: string;
  country?: string; // e.g. "IN" or "" for worldwide
  page?: number;
  refresh?: boolean;
}

export interface InternshipProviderResult {
  ok: boolean;
  providerId: string;
  providerName: string;
  providerUrl: string;
  isLive: boolean;
  fetchedAt: string;
  totalCount: number;
  page: number;
  opportunities: Opportunity[];
  cached: boolean;
  rateLimited?: boolean;
  error?: string;
}

export interface InternshipProvider {
  id: string;
  name: string;
  sourceUrl: string;
  isLive: boolean;
  searchInternships: (
    params: InternshipSearchParams
  ) => Promise<InternshipProviderResult>;
}
