import { Opportunity } from "@/types";

export interface CompetitionSearchParams {
  category?: string;
  country?: string; // "IN" | "all"
  mode?: string; // "Online" | "Offline" | "Hybrid" | "all"
  query?: string;
  page?: number;
  refresh?: boolean;
}

export interface CompetitionProviderResult {
  ok: boolean;
  providerId: string;
  providerName: string;
  sourceUrl: string;
  isLive: boolean;
  isDemo: boolean;
  fetchedAt: string;
  totalCount: number;
  page: number;
  opportunities: Opportunity[];
  cached: boolean;
  rateLimited?: boolean;
  error?: string;
}

export interface CompetitionProvider {
  id: string;
  name: string;
  sourceUrl: string;
  isLive: boolean;
  searchCompetitions: (
    params: CompetitionSearchParams
  ) => Promise<CompetitionProviderResult>;
}
