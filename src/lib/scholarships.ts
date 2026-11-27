import scholarshipsData from "@/data/scholarships.json";
import { Language, Scholarship, StudentProfile } from "@/types";

export const SCHOLARSHIPS: Scholarship[] = scholarshipsData as Scholarship[];

export const INCOME_OPTIONS = [
  { value: "Below ₹2.5 Lakh", lakh: 2.5 },
  { value: "₹2.5 Lakh – ₹5 Lakh", lakh: 5.0 },
  { value: "₹5 Lakh – ₹8 Lakh", lakh: 8.0 },
  { value: "Above ₹8 Lakh", lakh: 12.0 },
];

export const COURSE_OPTIONS = [
  "B.Tech",
  "B.Sc",
  "B.Com",
  "B.A",
  "Diploma",
  "MBBS",
  "M.Sc",
  "M.Tech",
];

export const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export const INSTITUTION_OPTIONS: Array<StudentProfile["institutionType"]> = [
  "Government",
  "Aided",
  "Private",
];

export const STATE_OPTIONS = [
  "West Bengal",
  "Uttar Pradesh",
  "Bihar",
  "Maharashtra",
  "Tamil Nadu",
  "Karnataka",
  "Rajasthan",
  "Odisha",
  "Madhya Pradesh",
  "Delhi",
  "Assam",
  "Other State / UT",
];

export function parseIncomeToLakh(income: string): number | null {
  const found = INCOME_OPTIONS.find((opt) => opt.value === income);
  if (found) return found.lakh;
  const lower = income.toLowerCase();
  if (lower.includes("above 8") || lower.includes("9") || lower.includes("10")) return 12.0;
  if (lower.includes("5-8") || lower.includes("5–8") || lower.includes("8")) return 8.0;
  if (lower.includes("2.5-5") || lower.includes("2.5–5") || lower.includes("5")) return 5.0;
  if (lower.includes("2.5") || lower.includes("below")) return 2.5;
  return null;
}

export interface EligibilityResult {
  status: "eligible" | "partial" | "not_eligible";
  score: number; // 0 to 100
  reasons: string[];
  missingFields: string[];
}

export function evaluateEligibility(
  profile: StudentProfile,
  scholarship: Scholarship,
  lang: Language
): EligibilityResult {
  const reasons: string[] = [];
  const missingFields: string[] = [];
  let checks = 0;
  let passed = 0;
  let hardFail = false;

  const { eligibilityCriteria: c } = scholarship;

  // Course check
  if (c.courses.length > 0) {
    checks++;
    if (!profile.course) {
      missingFields.push(lang === "hi" ? "पाठ्यक्रम" : lang === "bn" ? "কোর্স" : "Course");
    } else if (c.courses.includes(profile.course)) {
      passed++;
      reasons.push(
        lang === "hi"
          ? `पाठ्यक्रम (${profile.course}) मेल खाता है`
          : lang === "bn"
          ? `কোর্স (${profile.course}) মিলেছে`
          : `Course (${profile.course}) matches`
      );
    } else {
      hardFail = true;
      reasons.push(
        lang === "hi"
          ? `यह डेमो केवल ${c.courses.slice(0, 3).join(", ")} आदि के लिए है`
          : lang === "bn"
          ? `এই ডেমোটি মূলত ${c.courses.slice(0, 3).join(", ")} কোর্সের জন্য`
          : `Designed for ${c.courses.slice(0, 4).join(", ")}`
      );
    }
  }

  // Year check
  if (c.years.length > 0) {
    checks++;
    if (!profile.year) {
      missingFields.push(lang === "hi" ? "वर्ष" : lang === "bn" ? "বর্ষ" : "Year");
    } else if (c.years.includes(profile.year)) {
      passed++;
    } else {
      hardFail = true;
    }
  }

  // Institution Type check
  if (c.institutionTypes.length > 0) {
    checks++;
    if (!profile.institutionType) {
      missingFields.push(
        lang === "hi" ? "संस्थान का प्रकार" : lang === "bn" ? "প্রতিষ্ঠানের ধরন" : "Institution Type"
      );
    } else if (c.institutionTypes.includes(profile.institutionType)) {
      passed++;
      reasons.push(
        lang === "hi"
          ? `${profile.institutionType} संस्थान मान्य है`
          : lang === "bn"
          ? `${profile.institutionType} প্রতিষ্ঠান উপযুক্ত`
          : `${profile.institutionType} institution eligible`
      );
    } else {
      hardFail = true;
      reasons.push(
        lang === "hi"
          ? `केवल ${c.institutionTypes.join("/")} कॉलेजों के लिए`
          : lang === "bn"
          ? `শুধুমাত্র ${c.institutionTypes.join("/")} কলেজের জন্য`
          : `For ${c.institutionTypes.join(" / ")} colleges only`
      );
    }
  }

  // Income check
  if (c.maxIncomeLakh !== null) {
    checks++;
    const userLakh = parseIncomeToLakh(profile.annualIncome);
    if (userLakh === null) {
      missingFields.push(
        lang === "hi" ? "पारिवारिक आय" : lang === "bn" ? "পারিবারিক আয়" : "Family Income"
      );
    } else if (userLakh <= c.maxIncomeLakh) {
      passed++;
      reasons.push(
        lang === "hi"
          ? `आय सीमा (≤ ₹${c.maxIncomeLakh}L) के भीतर`
          : lang === "bn"
          ? `আয়ের সীমার (≤ ₹${c.maxIncomeLakh}L) মধ্যে`
          : `Within income limit (≤ ₹${c.maxIncomeLakh}L)`
      );
    } else {
      hardFail = true;
      reasons.push(
        lang === "hi"
          ? `अधिकतम आय सीमा ₹${c.maxIncomeLakh}L है`
          : lang === "bn"
          ? `সর্বোচ্চ আয়ের সীমা ₹${c.maxIncomeLakh}L`
          : `Income exceeds ₹${c.maxIncomeLakh}L limit`
      );
    }
  }

  // First-Gen bonus note
  if (scholarship.category === "First-Gen" && profile.firstGen) {
    reasons.push(
      lang === "hi"
        ? "प्रथम-पीढ़ी शिक्षार्थी प्राथमिकता"
        : lang === "bn"
        ? "প্রথম-প্রজন্মের শিক্ষার্থী অগ্রাধিকার"
        : "First-generation learner priority"
    );
  }

  const score = checks > 0 ? Math.round((passed / checks) * 100) : 100;

  let status: EligibilityResult["status"] = "partial";
  if (hardFail) {
    status = "not_eligible";
  } else if (missingFields.length === 0 && passed === checks) {
    status = "eligible";
  } else {
    status = "partial";
  }

  return { status, score, reasons, missingFields };
}
