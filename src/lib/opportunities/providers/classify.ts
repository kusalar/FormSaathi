import { EngineeringDomainType } from "@/types";

const ECE_VLSI_KEYWORDS = [
  "vlsi",
  "semiconductor",
  "chip design",
  "embedded",
  "fpga",
  "rtl",
  "verilog",
  "systemverilog",
  "digital electronics",
  "analog",
  "mixed signal",
  "signal processing",
  "telecommunication",
  "iot",
  "robotics",
  "ece",
  "hardware",
  "pcb",
  "microcontroller",
];

const RESEARCH_KEYWORDS = [
  "research",
  "fellowship",
  "srfp",
  "scientist",
  "laboratory",
  "lab ",
  "phd",
  "iisc",
  "iit",
  "isro",
  "drdo",
  "csir",
];

const CSE_SOFTWARE_KEYWORDS = [
  "software",
  "web development",
  "full stack",
  "frontend",
  "backend",
  "react",
  "typescript",
  "python",
  "artificial intelligence",
  "machine learning",
  "data science",
  "cybersecurity",
  "cloud",
  "mobile",
  "android",
  "ios",
  "devops",
];

const GENERAL_ENG_KEYWORDS = [
  "mechanical",
  "civil",
  "electrical",
  "chemical",
  "aerospace",
  "manufacturing",
  "cad",
];

export function classifyEngineeringDomain(
  text: string,
  isResearchSource = false
): EngineeringDomainType {
  const lower = text.toLowerCase();
  if (ECE_VLSI_KEYWORDS.some((k) => lower.includes(k))) return "ece_vlsi";
  if (isResearchSource || RESEARCH_KEYWORDS.some((k) => lower.includes(k))) {
    return "research";
  }
  if (CSE_SOFTWARE_KEYWORDS.some((k) => lower.includes(k))) return "cse_software";
  if (GENERAL_ENG_KEYWORDS.some((k) => lower.includes(k))) {
    return "general_engineering";
  }
  return "other";
}
