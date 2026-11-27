import opportunitiesData from "@/data/opportunities.json";
import { Opportunity } from "@/types";

export interface OpportunitySourceProvider {
  id: string;
  name: string;
  isLive: boolean;
  fetchOpportunities: () => Promise<Opportunity[]>;
}

export interface ApprovedOutboundDirectory {
  name: string;
  category: "Scholarships" | "Internships & Competitions" | "Jobs & Internships";
  url: string;
  description: string;
}

export const APPROVED_OUTBOUND_DIRECTORIES: ApprovedOutboundDirectory[] = [
  {
    name: "National Scholarship Portal (NSP)",
    category: "Scholarships",
    url: "https://scholarships.gov.in",
    description: "Official Government of India portal for Central & State scholarships.",
  },
  {
    name: "Naukri Campus",
    category: "Jobs & Internships",
    url: "https://www.naukri.com/campus",
    description: "Early-career internships and fresher jobs across India.",
  },
  {
    name: "Unstop",
    category: "Internships & Competitions",
    url: "https://unstop.com/internships",
    description: "Student internships, hackathons, and campus competitions.",
  },
  {
    name: "LinkedIn Jobs",
    category: "Jobs & Internships",
    url: "https://www.linkedin.com/jobs/internship-jobs/",
    description: "Verified company career listings and student internships.",
  },
  {
    name: "Glassdoor India",
    category: "Jobs & Internships",
    url: "https://www.glassdoor.co.in/Job/index.htm",
    description: "Entry-level tech and graduate trainee job searches.",
  },
];

export const DemoOpportunityProvider: OpportunitySourceProvider = {
  id: "demo-local-json",
  name: "FormSaathi Demonstration Catalog",
  isLive: false,
  async fetchOpportunities() {
    return opportunitiesData as Opportunity[];
  },
};

export const DEMO_OPPORTUNITIES: Opportunity[] = opportunitiesData as Opportunity[];

export async function getOpportunitiesFromProviders(): Promise<{
  opportunities: Opportunity[];
  isDemoOnly: boolean;
}> {
  const opportunities = await DemoOpportunityProvider.fetchOpportunities();
  return {
    opportunities,
    isDemoOnly: !DemoOpportunityProvider.isLive,
  };
}
