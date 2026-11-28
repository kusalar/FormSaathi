import { Language, StudentProfile, VoiceMessage } from "@/types";
import { COURSE_OPTIONS, INCOME_OPTIONS, STATE_OPTIONS, YEAR_OPTIONS, SCHOLARSHIPS, evaluateEligibility } from "./scholarships";
import { DEMO_OPPORTUNITIES } from "./opportunities/sources";
import { OFFICIAL_INDIAN_JOB_SOURCES } from "./opportunities/providers/indianOfficialJobs";
import { OFFICIAL_COMPETITION_DIRECTORIES } from "./opportunities/competitions/providers/officialDirectories";
import { matchCompetition } from "./opportunities/competitions/matcher";
import { matchOpportunity } from "./opportunities/matcher";
import { NATIONAL_OFFICIAL_SCHOLARSHIPS } from "./scholarships/providers/national";
import { WEST_BENGAL_SCHOLARSHIPS } from "./scholarships/providers/westBengal";
import { CORPORATE_SCHOLARSHIPS } from "./scholarships/providers/corporate";
import { matchNormalizedScholarship } from "./scholarships/matcher";

// Type declarations for browser Web Speech API
interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: { transcript: string; confidence: number };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

export interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

export function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakText(text: string, lang: Language, onEnd?: () => void): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const code = lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-IN" : "en-IN";
    utterance.lang = code;
    utterance.rate = 0.96;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice =
      voices.find((v) => v.lang.toLowerCase() === code.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(lang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

function detectCourse(text: string): string | null {
  const lower = text.toLowerCase();
  if (
    lower.includes("b.tech") ||
    lower.includes("btech") ||
    lower.includes("engineering") ||
    lower.includes("बीटेक") ||
    lower.includes("बी.टेक") ||
    lower.includes("বিটেক") ||
    lower.includes("বি.টেক") ||
    lower.includes("ইঞ্জিনিয়ারিং")
  ) {
    return "B.Tech";
  }
  if (
    lower.includes("b.sc") ||
    lower.includes("bsc") ||
    lower.includes("science") ||
    lower.includes("बीएससी") ||
    lower.includes("বিএসসি") ||
    lower.includes("বি.এসসি") ||
    lower.includes("বিজ্ঞান")
  ) {
    return "B.Sc";
  }
  if (
    lower.includes("b.com") ||
    lower.includes("bcom") ||
    lower.includes("commerce") ||
    lower.includes("बीकॉम") ||
    lower.includes("বিকম") ||
    lower.includes("বি.কম")
  ) {
    return "B.Com";
  }
  if (
    /\bb\.?a\.?\b/i.test(text) ||
    lower.includes("arts") ||
    lower.includes("बीए") ||
    lower.includes("বিএ") ||
    lower.includes("বি.এ")
  ) {
    return "B.A";
  }
  if (
    lower.includes("diploma") ||
    lower.includes("polytechnic") ||
    lower.includes("डिप्लोमा") ||
    lower.includes("ডিপ্লোমা")
  ) {
    return "Diploma";
  }
  if (lower.includes("mbbs") || lower.includes("medical") || lower.includes("এমবিবিএস")) return "MBBS";
  if (lower.includes("m.sc") || lower.includes("msc") || lower.includes("এমএসসি")) return "M.Sc";
  if (lower.includes("m.tech") || lower.includes("mtech") || lower.includes("এমটেক")) return "M.Tech";
  return COURSE_OPTIONS.find((c) => lower.includes(c.toLowerCase())) || null;
}

function detectYear(text: string): string | null {
  const lower = normalizeDigits(text).toLowerCase();
  if (
    lower.includes("first") ||
    lower.includes("1st") ||
    lower.includes("प्रथम") ||
    lower.includes("पहला") ||
    lower.includes("पहले") ||
    lower.includes("फर्स्ट") ||
    lower.includes("প্রথম") ||
    lower.includes("১ম") ||
    lower.includes("1ম") ||
    lower.includes("ফার্স্ট")
  ) {
    return "1st Year";
  }
  if (
    lower.includes("second") ||
    lower.includes("2nd") ||
    lower.includes("द्वितीय") ||
    lower.includes("दूसरा") ||
    lower.includes("दूसरे") ||
    lower.includes("सेकंड") ||
    lower.includes("দ্বিতীয়") ||
    lower.includes("দ্বিতিয়") ||
    lower.includes("২য়") ||
    lower.includes("2য়") ||
    lower.includes("সেকেন্ড")
  ) {
    return "2nd Year";
  }
  if (
    lower.includes("third") ||
    lower.includes("3rd") ||
    lower.includes("तीसरे") ||
    lower.includes("तीसरा") ||
    lower.includes("तृतीय") ||
    lower.includes("थर्ड") ||
    lower.includes("তৃতীয়") ||
    lower.includes("তৃতিয়") ||
    lower.includes("৩য়") ||
    lower.includes("3য়") ||
    lower.includes("থার্ড") ||
    lower.includes("তিন বছর") ||
    lower.includes("তিন বর্ষ")
  ) {
    return "3rd Year";
  }
  if (
    lower.includes("fourth") ||
    lower.includes("4th") ||
    lower.includes("final") ||
    lower.includes("चौथे") ||
    lower.includes("चौथा") ||
    lower.includes("फोर्थ") ||
    lower.includes("চতুর্থ") ||
    lower.includes("৪র্থ") ||
    lower.includes("4র্থ") ||
    lower.includes("ফোর্থ") ||
    lower.includes("ফাইনাল")
  ) {
    return "4th Year";
  }
  return YEAR_OPTIONS.find((y) => lower.includes(y.toLowerCase())) || null;
}

function detectInstitution(text: string): StudentProfile["institutionType"] | null {
  const lower = text.toLowerCase();
  if (lower.includes("govt") || lower.includes("government") || lower.includes("सरकारी") || lower.includes("সরকারি")) return "Government";
  if (lower.includes("aided") || lower.includes("सहायता") || lower.includes("পোষিত")) return "Aided";
  if (lower.includes("private") || lower.includes("प्राइवेट") || lower.includes("निजी") || lower.includes("বেসরকারি")) return "Private";
  return null;
}

function normalizeDigits(text: string): string {
  const bnDigits = "০১২৩৪৫৬৭৮৯";
  const hiDigits = "०१२३४५६७८९";
  return text
    .replace(/[০-৯]/g, (d) => String(bnDigits.indexOf(d)))
    .replace(/[०-९]/g, (d) => String(hiDigits.indexOf(d)));
}

function detectIncome(text: string): string | null {
  const normalized = normalizeDigits(text).toLowerCase();

  // 1. Exact option match first (e.g. clicking quick reply chip "₹5 Lakh – ₹8 Lakh")
  const exact = INCOME_OPTIONS.find((opt) => opt.value.toLowerCase() === text.trim().toLowerCase());
  if (exact) return exact.value;

  // 2. Above 8 Lakh (check before 8 lakh)
  if (
    normalized.includes("above 8") ||
    normalized.includes("more than 8") ||
    normalized.includes("9 lakh") ||
    normalized.includes("10 lakh") ||
    normalized.includes("8 लाख से अधिक") ||
    normalized.includes("8 लाख से ज्यादा") ||
    normalized.includes("8 লক্ষের বেশি") ||
    normalized.includes("8 লাখের বেশি")
  ) {
    return INCOME_OPTIONS[3].value;
  }

  // 3. 5 Lakh - 8 Lakh (check BEFORE 2.5-5 Lakh so "5-8 lakh" or "5 to 8 lakh" never matches "5 lakh"!)
  if (
    /5\s*[-–toसेথেকে]+\s*8/.test(normalized) ||
    normalized.includes("6 lakh") ||
    normalized.includes("7 lakh") ||
    normalized.includes("8 lakh") ||
    normalized.includes("6 लाख") ||
    normalized.includes("7 लाख") ||
    normalized.includes("8 लाख") ||
    normalized.includes("6 লক্ষ") ||
    normalized.includes("7 লক্ষ") ||
    normalized.includes("8 লক্ষ") ||
    normalized.includes("6 লাখ") ||
    normalized.includes("7 লাখ") ||
    normalized.includes("8 লাখ")
  ) {
    return INCOME_OPTIONS[2].value;
  }

  // 4. 2.5 Lakh - 5 Lakh
  if (
    /2\.?5\s*[-–toसेথেকে]+\s*5/.test(normalized) ||
    normalized.includes("3 lakh") ||
    normalized.includes("4 lakh") ||
    normalized.includes("5 lakh") ||
    normalized.includes("3 लाख") ||
    normalized.includes("4 लाख") ||
    normalized.includes("5 लाख") ||
    normalized.includes("तीन लाख") ||
    normalized.includes("चार लाख") ||
    normalized.includes("पांच लाख") ||
    normalized.includes("3 লক্ষ") ||
    normalized.includes("4 লক্ষ") ||
    normalized.includes("5 লক্ষ") ||
    normalized.includes("3 লাখ") ||
    normalized.includes("4 লাখ") ||
    normalized.includes("5 লাখ")
  ) {
    return INCOME_OPTIONS[1].value;
  }

  // 5. Below 2.5 Lakh
  if (
    normalized.includes("below 2.5") ||
    normalized.includes("1 lakh") ||
    normalized.includes("2 lakh") ||
    normalized.includes("2.5") ||
    normalized.includes("below 2") ||
    normalized.includes("low income") ||
    normalized.includes("1 लाख") ||
    normalized.includes("2 लाख") ||
    normalized.includes("दो लाख") ||
    normalized.includes("कम") ||
    normalized.includes("1 লক্ষ") ||
    normalized.includes("2 লক্ষ") ||
    normalized.includes("1 লাখ") ||
    normalized.includes("2 লাখ") ||
    normalized.includes("কম")
  ) {
    return INCOME_OPTIONS[0].value;
  }

  return null;
}

const STATE_ALIASES: Record<string, string> = {
  "west bengal": "West Bengal",
  "পশ্চিমবঙ্গ": "West Bengal",
  "पश्चिम बंगाल": "West Bengal",
  "uttar pradesh": "Uttar Pradesh",
  "उत्तर प्रदेश": "Uttar Pradesh",
  "উত্তর প্রদেশ": "Uttar Pradesh",
  "bihar": "Bihar",
  "बिहार": "Bihar",
  "বিহার": "Bihar",
  "maharashtra": "Maharashtra",
  "महाराष्ट्र": "Maharashtra",
  "মহারাষ্ট্র": "Maharashtra",
  "tamil nadu": "Tamil Nadu",
  "तमिलनाडु": "Tamil Nadu",
  "তামিলনাড়ু": "Tamil Nadu",
  "karnataka": "Karnataka",
  "कर्नाटक": "Karnataka",
  "কর্ণাটক": "Karnataka",
  "rajasthan": "Rajasthan",
  "राजस्थान": "Rajasthan",
  "রাজস্থান": "Rajasthan",
  "odisha": "Odisha",
  "ओडिशा": "Odisha",
  "ওড়িশা": "Odisha",
  "madhya pradesh": "Madhya Pradesh",
  "मध्य प्रदेश": "Madhya Pradesh",
  "delhi": "Delhi",
  "दिल्ली": "Delhi",
  "দিল্লি": "Delhi",
  "assam": "Assam",
  "असम": "Assam",
  "আসাম": "Assam",
};

function detectState(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [alias, canonical] of Object.entries(STATE_ALIASES)) {
    if (lower.includes(alias)) return canonical;
  }
  return STATE_OPTIONS.find((s) => lower.includes(s.toLowerCase())) || null;
}

export function getNextMissingQuestion(profile: StudentProfile, lang: Language): {
  field: keyof StudentProfile;
  question: string;
  quickReplies: string[];
} | null {
  if (!profile.course) {
    return {
      field: "course",
      question:
        lang === "hi"
          ? "आप वर्तमान में कौन सा पाठ्यक्रम (कोर्स) पढ़ रहे हैं?"
          : lang === "bn"
          ? "আপনি বর্তমানে কোন কোর্সে পড়াশোনা করছেন?"
          : "What course are you studying?",
      quickReplies: ["B.Tech", "B.Sc", "B.Com", "B.A", "Diploma"],
    };
  }
  if (!profile.year) {
    return {
      field: "year",
      question:
        lang === "hi"
          ? "आप किस वर्ष (Year) में हैं?"
          : lang === "bn"
          ? "আপনি কোন বর্ষে (Year) পড়ছেন?"
          : "Which year are you in?",
      quickReplies: YEAR_OPTIONS,
    };
  }
  if (!profile.institutionType) {
    return {
      field: "institutionType",
      question:
        lang === "hi"
          ? "आपके कॉलेज या संस्थान का प्रकार क्या है?"
          : lang === "bn"
          ? "আপনার কলেজ বা প্রতিষ্ঠানের ধরন কী?"
          : "What is your institution type?",
      quickReplies: ["Government", "Aided", "Private"],
    };
  }
  if (!profile.annualIncome) {
    return {
      field: "annualIncome",
      question:
        lang === "hi"
          ? "आपके परिवार की अनुमानित वार्षिक आय कितनी है?"
          : lang === "bn"
          ? "আপনার পরিবারের আনুমানিক বার্ষিক আয় কত?"
          : "What is your approximate family income?",
      quickReplies: INCOME_OPTIONS.map((i) => i.value),
    };
  }
  if (!profile.state) {
    return {
      field: "state",
      question:
        lang === "hi"
          ? "आप किस राज्य में रहते हैं?"
          : lang === "bn"
          ? "আপনি কোন রাজ্যে থাকেন?"
          : "Which state do you live in?",
      quickReplies: ["West Bengal", "Uttar Pradesh", "Bihar", "Maharashtra", "Tamil Nadu"],
    };
  }
  return null;
}

export function generateAssistantReply(
  input: string,
  profile: StudentProfile,
  lang: Language
): {
  reply: Omit<VoiceMessage, "id" | "timestamp">;
  detectedUpdates: Partial<StudentProfile>;
} {
  const lower = input.toLowerCase();
  const detectedUpdates: Partial<StudentProfile> = {};

  const course = detectCourse(input);
  const year = detectYear(input);
  const inst = detectInstitution(input);
  const income = detectIncome(input);
  const state = detectState(input);

  if (course && course !== profile.course) detectedUpdates.course = course;
  if (year && year !== profile.year) detectedUpdates.year = year;
  if (inst && inst !== profile.institutionType) detectedUpdates.institutionType = inst;
  if (income && income !== profile.annualIncome) detectedUpdates.annualIncome = income;
  if (state && state !== profile.state) detectedUpdates.state = state;

  const detectedEntries = Object.entries(detectedUpdates) as Array<[keyof StudentProfile, string]>;

  // If we detected profile details from natural speech, confirm the first key one before using it!
  if (detectedEntries.length > 0) {
    const summaryParts: string[] = [];
    if (detectedUpdates.year) summaryParts.push(detectedUpdates.year);
    if (detectedUpdates.course) summaryParts.push(detectedUpdates.course);
    if (detectedUpdates.institutionType) summaryParts.push(`${detectedUpdates.institutionType} college`);
    if (detectedUpdates.annualIncome) summaryParts.push(detectedUpdates.annualIncome);
    if (detectedUpdates.state) summaryParts.push(detectedUpdates.state);

    const summaryStr = summaryParts.join(", ");
    const [primaryField, primaryValue] = detectedEntries[0];

    const text =
      lang === "hi"
        ? `मैंने सुना: ${summaryStr}। क्या मैं इसे आपकी प्रोफ़ाइल में सहेज लूं ताकि सही छात्रवृत्तियाँ खोज सकूं?`
        : lang === "bn"
        ? `আমি শুনেছি: ${summaryStr}। সঠিক বৃত্তি খোঁজার জন্য আমি কি এটি আপনার প্রোফাইলে সংরক্ষণ করব?`
        : `I heard: ${summaryStr}. Please confirm if I should save this to your profile before checking scholarships.`;

    return {
      detectedUpdates,
      reply: {
        role: "assistant",
        lang,
        text,
        confirmation: {
          field: primaryField,
          value: String(primaryValue),
          label: summaryStr,
          confirmed: false,
        },
      },
    };
  }

  // Hackathons, Competitions & Student Ambassador intents (English, Hindi, Bengali)
  const wantsHackathon =
    lower.includes("hackathon") ||
    lower.includes("hackathons") ||
    lower.includes("हैकाथॉन") ||
    lower.includes("হ্যাকাথন");
  const wantsCompetition =
    lower.includes("competition") ||
    lower.includes("competitions") ||
    lower.includes("प्रतियोगिता") ||
    lower.includes("প্রতিযোগিতা");
  const wantsAmbassador =
    lower.includes("ambassador") ||
    lower.includes("एंबेसडर") ||
    lower.includes("অ্যাম্বাসাডর");

  if (wantsHackathon || wantsCompetition || wantsAmbassador) {
    const mentionsEceComp = lower.includes("ece") || lower.includes("vlsi");
    const wantsOnlineComp =
      lower.includes("online") || lower.includes("ऑनलाइन") || lower.includes("অনলাইন");
    const wantsBeginnerComp =
      lower.includes("beginner") || lower.includes("शुरुआती") || lower.includes("নতুন");

    const tempProfile: StudentProfile = {
      ...profile,
      ...(mentionsEceComp && !profile.branch ? { branch: "ECE" } : {}),
    };

    const hits = OFFICIAL_COMPETITION_DIRECTORIES.filter((opp) => {
      if (wantsAmbassador && opp.competitionSubCategory !== "student_ambassador") {
        return false;
      }
      if (wantsOnlineComp && opp.workMode !== "Remote" && opp.workMode !== "Hybrid") {
        return false;
      }
      if (wantsBeginnerComp && !opp.beginnerFriendly) return false;
      if (mentionsEceComp) {
        const hay = `${opp.title} ${opp.description} ${opp.requiredBranches.join(" ")}`.toLowerCase();
        if (!hay.includes("ece") && !hay.includes("iot") && !hay.includes("hardware")) {
          return false;
        }
      }
      return true;
    })
      .map((opp) => ({ opp, match: matchCompetition(tempProfile, opp) }))
      .sort((a, b) => b.match.percentage - a.match.percentage)
      .slice(0, 3);

    const text =
      lang === "hi"
        ? `यहाँ ${hits.length} आधिकारिक हैकाथॉन / प्रतियोगिता / एंबेसडर अवसर हैं। पात्रता और अंतिम तिथियों की पुष्टि आधिकारिक पोर्टल पर करें:`
        : lang === "bn"
        ? `এখানে ${hits.length}টি অফিসিয়াল হ্যাকাথন / প্রতিযোগিতা / অ্যাম্বাসাডর সুযোগ রয়েছে। যোগ্যতা ও শেষ তারিখ অফিসিয়াল পোর্টালে যাচাই করুন:`
        : `Here are ${hits.length} relevant hackathons, competitions, and ambassador programmes (please verify current dates and eligibility on the official organizer website):`;

    return {
      detectedUpdates: {},
      reply: {
        role: "assistant",
        lang,
        text,
        matchedScholarships: hits.map(({ opp, match }) => ({
          id: opp.id,
          name: opp.title,
          amount: `${opp.sourceBadge || "OFFICIAL DIRECTORY"} • ${match.percentage}%`,
          reasons:
            match.reasons.length > 0
              ? match.reasons
              : ["Verify current season dates on official portal"],
        })),
        actions: [
          {
            label:
              lang === "hi"
                ? "सभी हैकाथॉन और प्रतियोगिताएं देखें"
                : lang === "bn"
                ? "সব হ্যাকাথন ও প্রতিযোগিতা দেখুন"
                : "Open Hackathons & Competitions",
            href: "/opportunities",
          },
        ],
      },
    };
  }

  // Scholarship discovery intents (government, West Bengal, engineering, closing soon)
  const wantsScholarship =
    lower.includes("scholarship") ||
    lower.includes("scholarships") ||
    lower.includes("छात्रवृत्ति") ||
    lower.includes("বৃত্তি");

  if (wantsScholarship && !course && !year && !inst && !income && !state) {
    const wantsGov =
      lower.includes("government") ||
      lower.includes("govt") ||
      lower.includes("nsp") ||
      lower.includes("सरकारी") ||
      lower.includes("সরকারি");
    const wantsWb =
      lower.includes("west bengal") ||
      lower.includes("svmcm") ||
      lower.includes("aikyashree") ||
      lower.includes("oasis") ||
      lower.includes("पশ্চिम बंगाल") ||
      lower.includes("পশ্চিমবঙ্গ");
    const wantsEng =
      lower.includes("engineering") ||
      lower.includes("b.tech") ||
      lower.includes("stem") ||
      lower.includes("इंजीनियरिंग") ||
      lower.includes("ইঞ্জিনিয়ারিং");
    const wantsClosingSoon =
      lower.includes("closing") ||
      lower.includes("deadline") ||
      lower.includes("अंतिम तिथि") ||
      lower.includes("শেষ তারিখ");

    const allOfficial = [
      ...NATIONAL_OFFICIAL_SCHOLARSHIPS,
      ...WEST_BENGAL_SCHOLARSHIPS,
      ...CORPORATE_SCHOLARSHIPS,
    ];

    const filteredPool = allOfficial.filter((sch) => {
      if (wantsWb) return sch.category === "West Bengal";
      if (wantsGov) return sch.category === "Government" || sch.category === "West Bengal";
      if (wantsEng) return sch.eligibleDegrees.includes("B.Tech");
      return true;
    });

    const ranked = filteredPool
      .map((sch) => ({ sch, match: matchNormalizedScholarship(profile, sch) }))
      .filter((x) => x.match.status !== "NOT_ELIGIBLE" && x.match.status !== "CLOSED")
      .sort((a, b) => b.match.percentage - a.match.percentage)
      .slice(0, 3);

    const disclaimer =
      lang === "hi"
        ? "ध्यान दें: यह पात्रता प्रारंभिक है; अंतिम निर्णय आधिकारिक छात्रवृत्ति पोर्टल द्वारा किया जाता है।"
        : lang === "bn"
        ? "মনে রাখবেন: এই যোগ্যতা প্রাথমিক; চূড়ান্ত সিদ্ধান্ত অফিসিয়াল বৃত্তি কর্তৃপক্ষ নেয়।"
        : "Note: Eligibility is preliminary—the official scholarship authority makes the final decision.";

    const baseText = wantsClosingSoon
      ? lang === "hi"
        ? "आधिकारिक पोर्टल की अंतिम तिथियां समय-समय पर बदलती हैं, इसलिए कृपया सीधे पोर्टल पर जांचें।"
        : lang === "bn"
        ? "অফিসিয়াল পোর্টালের শেষ তারিখ পরিবর্তিত হয়, তাই সরাসরি পোর্টালে যাচাই করুন।"
        : "Official portal deadlines vary by academic cycle; please verify current dates directly on each official portal."
      : lang === "hi"
      ? `यहाँ ${ranked.length} प्रासंगिक आधिकारिक छात्रवृत्ति स्रोत हैं:`
      : lang === "bn"
      ? `এখানে ${ranked.length}টি প্রাসঙ্গিক অফিসিয়াল বৃত্তি উৎস রয়েছে:`
      : `Here are ${ranked.length} relevant official scholarship sources for you:`;

    return {
      detectedUpdates: {},
      reply: {
        role: "assistant",
        lang,
        text: `${baseText} ${disclaimer}`,
        matchedScholarships: ranked.map(({ sch, match }) => ({
          id: sch.id,
          name: sch.title,
          amount: `${sch.dataSourceType} • ${match.percentage}%`,
          reasons:
            match.satisfied.length > 0
              ? match.satisfied
              : ["Check official portal for current eligibility & dates"],
        })),
        actions: [
          {
            label:
              lang === "hi"
                ? "सभी छात्रवृत्तियाँ देखें"
                : lang === "bn"
                ? "সব বৃত্তি দেখুন"
                : "Open Find Scholarships",
            href: "/scholarships",
          },
        ],
      },
    };
  }

  // Opportunity discovery intents (internships, jobs, remote, ECE/CSE, scholarships)
  const wantsInternship =
    lower.includes("internship") ||
    lower.includes("intern") ||
    lower.includes("इंटर्नशिप") ||
    lower.includes("ইন্টার্নশিপ");
  const wantsJob =
    lower.includes("job") ||
    lower.includes("jobs") ||
    lower.includes("नौकरी") ||
    lower.includes("চাকরি");
  const wantsRemote =
    lower.includes("remote") || lower.includes("रिमोट") || lower.includes("রিমোট");
  const mentionsEce = lower.includes("ece") || lower.includes("electronics");

  const wantsFresher =
    lower.includes("fresher") ||
    lower.includes("graduate") ||
    lower.includes("trainee") ||
    lower.includes("फ्रेशर") ||
    lower.includes("ফ্রেশার");
  const wantsVlsi = lower.includes("vlsi") || lower.includes("semiconductor");
  const wantsSoftware =
    lower.includes("software") || lower.includes("developer") || lower.includes("সফটওয়্যার");

  if (wantsInternship || wantsJob) {
    const targetCategory = wantsInternship ? "internship" : "job";
    const tempProfile: StudentProfile = {
      ...profile,
      ...((mentionsEce || wantsVlsi) && !profile.branch ? { branch: "ECE" } : {}),
      ...(wantsSoftware && !profile.branch ? { branch: "CSE" } : {}),
      ...(wantsRemote && !profile.preferredWorkMode ? { preferredWorkMode: "Remote" } : {}),
    };

    const pool = wantsJob
      ? [
          ...OFFICIAL_INDIAN_JOB_SOURCES,
          ...DEMO_OPPORTUNITIES.filter((o) => o.category === "job"),
        ]
      : DEMO_OPPORTUNITIES.filter((o) => o.category === "internship");

    const hits = pool
      .filter((opp) => {
        if (opp.category !== targetCategory) return false;
        if (opp.status === "expired") return false;
        if (wantsRemote && opp.workMode !== "Remote") return false;
        if (wantsFresher && opp.experienceClassification === "experience_required") {
          return false;
        }
        if (mentionsEce || wantsVlsi) {
          const hay = `${opp.title} ${opp.description} ${opp.requiredBranches.join(" ")}`.toLowerCase();
          if (!hay.includes("ece") && !hay.includes("vlsi") && !hay.includes("embedded") && !hay.includes("semiconductor")) {
            return false;
          }
        }
        return true;
      })
      .map((opp) => ({ opp, match: matchOpportunity(tempProfile, opp) }))
      .sort((a, b) => b.match.percentage - a.match.percentage)
      .slice(0, 3);

    const text =
      hits.length > 0
        ? lang === "hi"
          ? `यहाँ आपके अनुरोध से मेल खाने वाले ${hits.length} डेमो ${wantsInternship ? "इंटर्नशिप" : "नौकरी"} अवसर हैं:`
          : lang === "bn"
          ? `আপনার অনুরোধের সাথে মিলে যাওয়া ${hits.length}টি ডেমো ${wantsInternship ? "ইন্টার্নশিপ" : "চাকরি"} সুযোগ এখানে রয়েছে:`
          : `Here are ${hits.length} demonstration ${targetCategory}s matching your request:`
        : lang === "hi"
        ? "अभी सटीक मिलान नहीं मिला। कृपया 'Opportunities For You' पेज पर सभी फ़िल्टर आज़माएं या अपनी प्रोफ़ाइल अपडेट करें।"
        : lang === "bn"
        ? "এই মুহূর্তে সঠিক মিল পাওয়া যায়নি। অনুগ্রহ করে 'Opportunities For You' পেজে ফিল্টার দেখুন বা প্রোফাইল আপডেট করুন।"
        : "I couldn't find an exact match for that filter right now. Open Opportunities For You to browse all listings or update your skills in My Profile.";

    return {
      detectedUpdates: {},
      reply: {
        role: "assistant",
        lang,
        text,
        matchedScholarships: hits.map(({ opp, match }) => ({
          id: opp.id,
          name: opp.title,
          amount: `${opp.stipendOrSalary} • ${match.percentage}% Match`,
          reasons:
            match.reasons.length > 0
              ? match.reasons
              : match.verificationNeeded.map((v) => `Needs verification: ${v}`),
        })),
        actions: [
          {
            label:
              lang === "hi"
                ? "सभी अवसर देखें"
                : lang === "bn"
                ? "সব সুযোগ দেখুন"
                : "Open Opportunities For You",
            href: "/opportunities",
          },
        ],
      },
    };
  }

  // Phase 5.6 Unified Recommendation Intents
  const wantsUnifiedClosingSoon =
    lower.includes("closing soon") ||
    lower.includes("deadline") ||
    lower.includes("जल्द बंद") ||
    lower.includes("শীঘ্রই শেষ");
  const wantsUnifiedSaved =
    lower.includes("saved") ||
    lower.includes("सहेजे गए") ||
    lower.includes("সংরক্ষিত");
  const wantsUnifiedRecommendations =
    wantsUnifiedClosingSoon ||
    wantsUnifiedSaved ||
    lower.includes("best opportunities") ||
    lower.includes("recommend") ||
    lower.includes("for me right now") ||
    lower.includes("ece background") ||
    lower.includes("what should i apply") ||
    lower.includes("सबसे अच्छे अवसर") ||
    lower.includes("मेरे लिए अवसर") ||
    lower.includes("সেরা সুযোগ") ||
    lower.includes("আমার জন্য সুযোগ");

  if (wantsUnifiedRecommendations) {
    const targetHref = wantsUnifiedClosingSoon
      ? "/recommendations?section=closing_soon"
      : wantsUnifiedSaved
      ? "/recommendations?filter=saved"
      : "/recommendations";

    const text = wantsUnifiedClosingSoon
      ? lang === "hi"
        ? "मैंने आपके लिए जल्द बंद होने वाले अवसरों का सेक्शन तैयार किया है। ध्यान दें: ये प्रारंभिक मिलान हैं — अंतिम पात्रता और अंतिम तिथि आधिकारिक पोर्टल पर अवश्य जांचें।"
        : lang === "bn"
        ? "আমি আপনার জন্য শীঘ্রই শেষ হতে চলা সুযোগগুলোর তালিকা তৈরি করেছি। মনে রাখবেন: এগুলো প্রাথমিক মিল — চূড়ান্ত যোগ্যতা ও শেষ তারিখ অফিসিয়াল পোর্টালে যাচাই করুন।"
        : "I've opened the Closing Soon unified recommendations for you. Note: match scores are preliminary guidance — always verify final eligibility and deadlines on the official portal."
      : wantsUnifiedSaved
      ? lang === "hi"
        ? "आप अपने सहेजे गए और ट्रैक किए गए सभी अवसर 'Opportunities For You' पेज पर देख सकते हैं।"
        : lang === "bn"
        ? "আপনি আপনার সংরক্ষিত ও ট্র্যাক করা সব সুযোগ 'Opportunities For You' পেজে দেখতে পারেন।"
        : "You can review all your saved and tracked opportunities in one place on the Opportunities For You page."
      : lang === "hi"
      ? "आपकी प्रोफ़ाइल के आधार पर छात्रवृत्ति, इंटर्नशिप, नौकरी, हैकथॉन और छात्र नेतृत्व के सर्वोत्तम अवसर एक साथ 'Opportunities For You' में रैंक किए गए हैं। ध्यान दें: यह केवल प्रारंभिक पात्रता मार्गदर्शन है — अंतिम पुष्टि आधिकारिक पोर्टल पर करें।"
      : lang === "bn"
      ? "আপনার প্রোফাইল অনুযায়ী বৃত্তি, ইন্টার্নশিপ, চাকরি, হ্যাকাথন এবং স্টুডেন্ট লিডারশিপের সেরা সুযোগগুলো একসাথে 'Opportunities For You'-তে সাজানো হয়েছে। মনে রাখবেন: এটি কেবল প্রাথমিক যোগ্যতা নির্দেশিকা — চূড়ান্ত তথ্য অফিসিয়াল পোর্টালে যাচাই করুন।"
      : "I've ranked your top opportunities across scholarships, internships, jobs, hackathons, and leadership in one unified feed on Opportunities For You. These are preliminary eligibility estimates — please confirm final criteria on each official portal.";

    return {
      detectedUpdates: {},
      reply: {
        role: "assistant",
        lang,
        text,
        actions: [
          {
            label:
              lang === "hi"
                ? "आपके लिए अवसर खोलें"
                : lang === "bn"
                ? "আপনার জন্য সুযোগ খুলুন"
                : wantsUnifiedClosingSoon
                ? "View Closing Soon"
                : wantsUnifiedSaved
                ? "View Saved Opportunities"
                : "Open Opportunities For You",
            href: targetHref,
          },
        ],
      },
    };
  }

  // Document checklist intent
  if (lower.includes("document") || lower.includes("checklist") || lower.includes("दस्तावेज़") || lower.includes("নথি")) {
    const text =
      lang === "hi"
        ? "ज्यादातर छात्रवृत्तियों के लिए आपको अंकतालिका, पारिवारिक आय प्रमाण पत्र, और कॉलेज बोनाफाइड प्रमाण पत्र की आवश्यकता होती है। मैं आपको दस्तावेज़ सूची पेज पर ले जा सकता हूँ।"
        : lang === "bn"
        ? "বেশিরভাগ বৃত্তির জন্য মার্কশিট, পারিবারিক আয়ের শংসাপত্র এবং কলেজ বোনাফাইড শংসাপত্র প্রয়োজন। আপনি নথিপত্র তালিকা পেজে গিয়ে প্রতিটি নথি টিক দিতে পারেন।"
        : "For most scholarships, you will need your previous marksheet, family income certificate, and college bonafide certificate. You can track them on the Document Checklist page.";
    return {
      detectedUpdates: {},
      reply: {
        role: "assistant",
        lang,
        text,
        actions: [
          {
            label: lang === "hi" ? "दस्तावेज़ सूची खोलें" : lang === "bn" ? "নথিপত্র তালিকা খুলুন" : "Open Document Checklist",
            href: "/documents",
          },
        ],
      },
    };
  }

  // Application help intent
  if (lower.includes("apply") || lower.includes("application") || lower.includes("आवेदन") || lower.includes("আবেদন")) {
    const text =
      lang === "hi"
        ? "FormSaathi आपकी तैयारी में मदद करता है, लेकिन सुरक्षा के लिए हम कभी भी अपने आप फॉर्म जमा नहीं करते। सबसे पहले अपनी पात्रता जांचें और दस्तावेज़ तैयार करें।"
        : lang === "bn"
        ? "FormSaathi আপনাকে প্রস্তুতিতে সাহায্য করে, তবে নিরাপত্তার জন্য আমরা কখনো নিজে থেকে ফর্ম জমা দিই না। প্রথমে আপনার যোগ্যতা যাচাই করুন এবং নথিপত্র প্রস্তুত করুন।"
        : "FormSaathi guides your preparation step by step, and for your safety we never submit forms automatically. Let's check your eligibility and document readiness first.";
    return {
      detectedUpdates: {},
      reply: {
        role: "assistant",
        lang,
        text,
        actions: [
          {
            label: lang === "hi" ? "पात्रता जांच शुरू करें" : lang === "bn" ? "যোগ্যতা যাচাই শুরু করুন" : "Start Eligibility Check",
            href: "/eligibility",
          },
          {
            label: lang === "hi" ? "डेमो छात्रवृत्तियाँ देखें" : lang === "bn" ? "ডেমো বৃত্তি দেখুন" : "Browse Demo Scholarships",
            href: "/scholarships",
          },
        ],
      },
    };
  }

  // Check if profile has missing fields -> ask one question at a time
  const nextQ = getNextMissingQuestion(profile, lang);
  if (nextQ) {
    return {
      detectedUpdates: {},
      reply: {
        role: "assistant",
        lang,
        text: nextQ.question,
        actions: nextQ.quickReplies.slice(0, 4).map((q) => ({
          label: q,
          promptText: q,
        })),
      },
    };
  }

  // Profile is complete -> summarize matching demo scholarships with match reasons!
  const matchedList = buildMatchedScholarshipsList(profile, lang);

  const text =
    lang === "hi"
      ? `आपकी प्रोफ़ाइल (${profile.course}, ${profile.year}, ${profile.institutionType}, ${profile.annualIncome}, ${profile.state}) के आधार पर, आपको ${matchedList.length} डेमो छात्रवृत्तियाँ मिल सकती हैं। नीचे प्रत्येक का कारण देखें:`
      : lang === "bn"
      ? `আপনার প্রোফাইল (${profile.course}, ${profile.year}, ${profile.institutionType}, ${profile.annualIncome}, ${profile.state}) অনুযায়ী আপনি ${matchedList.length}টি ডেমো বৃত্তির জন্য যোগ্য হতে পারেন। নিচে কারণ দেখুন:`
      : `Based on your profile (${profile.course}, ${profile.year}, ${profile.institutionType}, ${profile.annualIncome}, ${profile.state}), here are ${matchedList.length} matching demonstration scholarships and why each may fit:`;

  return {
    detectedUpdates: {},
    reply: {
      role: "assistant",
      lang,
      text,
      matchedScholarships: matchedList,
      actions: [
        {
          label: lang === "hi" ? "सभी छात्रवृत्तियाँ देखें" : lang === "bn" ? "সব বৃত্তি দেখুন" : "Browse All Scholarships",
          href: "/scholarships",
        },
        {
          label: lang === "hi" ? "दस्तावेज़ सूची देखें" : lang === "bn" ? "নথিপত্র তালিকা দেখুন" : "View Document Checklist",
          href: "/documents",
        },
      ],
    },
  };
}

export function buildMatchedScholarshipsList(
  profile: StudentProfile,
  lang: Language
): NonNullable<VoiceMessage["matchedScholarships"]> {
  return SCHOLARSHIPS.map((s) => ({
    scholarship: s,
    eval: evaluateEligibility(profile, s, lang),
  }))
    .filter((item) => item.eval.status === "eligible")
    .map((item) => ({
      id: item.scholarship.id,
      name: item.scholarship.name[lang] || item.scholarship.name.en,
      amount: item.scholarship.amountLabel[lang] || item.scholarship.amountLabel.en,
      reasons: item.eval.reasons,
    }));
}

export function isAffirmativeReply(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return ["yes", "yeah", "yep", "correct", "confirm", "right", "ok", "okay", "haan", "हाँ", "হ্যাঁ"].some(
    (w) => lower === w || lower.startsWith(`${w} `)
  );
}

export function isNegativeReply(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return ["no", "nope", "wrong", "incorrect", "edit", "change", "nahi", "नहीं", "না"].some(
    (w) => lower === w || lower.startsWith(`${w} `)
  );
}
