import { Language } from "@/types";

export const LANGUAGE_META: Record<
  Language,
  { label: string; nativeName: string; speechCode: string }
> = {
  en: { label: "English", nativeName: "English", speechCode: "en-IN" },
  hi: { label: "Hindi", nativeName: "हिन्दी", speechCode: "hi-IN" },
  bn: { label: "Bengali", nativeName: "বাংলা", speechCode: "bn-IN" },
};

export const UI_TEXT = {
  brandTagline: {
    en: "Your Scholarship Guide",
    hi: "आपका छात्रवृत्ति मार्गदर्शक",
    bn: "আপনার বৃত্তি সহায়ক",
  },
  nav: {
    home: { en: "Home", hi: "होम", bn: "হোম" },
    recommendations: {
      en: "For You",
      hi: "आपके लिए",
      bn: "আপনার জন্য",
    },
    opportunities: {
      en: "Opportunities For You",
      hi: "आपके लिए अवसर",
      bn: "আপনার জন্য সুযোগ",
    },
    findScholarships: {
      en: "Find Scholarships",
      hi: "छात्रवृत्ति खोजें",
      bn: "বৃত্তি খুঁজুন",
    },
    findInternships: {
      en: "Find Internships",
      hi: "इंटर्नशिप खोजें",
      bn: "ইন্টার্নশিপ খুঁজুন",
    },
    findResearch: {
      en: "Research & Fellowships",
      hi: "रिसर्च और फ़ेलोशिप",
      bn: "রিসার্চ ও ফেলোশিপ",
    },
    findJobs: {
      en: "Find Jobs",
      hi: "नौकरी खोजें",
      bn: "চাকরি খুঁজুন",
    },
    profile: { en: "My Profile", hi: "मेरी प्रोफ़ाइल", bn: "আমার প্রোফাইল" },
    scholarships: { en: "Find Scholarships", hi: "छात्रवृत्ति खोजें", bn: "বৃত্তি খুঁজুন" },
    eligibility: { en: "Eligibility Check", hi: "पात्रता जांच", bn: "যোগ্যতা যাচাই" },
    documents: { en: "Document Checklist", hi: "दस्तावेज़ सूची", bn: "নথিপত্র তালিকা" },
    assistant: { en: "Application Assistant", hi: "आवेदन सहायक", bn: "আবেদন সহায়ক" },
    progress: { en: "My Progress", hi: "मेरी प्रगति", bn: "আমার অগ্রগতি" },
    help: { en: "Help & Support", hi: "सहायता", bn: "সাহায্য ও সহায়তা" },
  },
  hero: {
    badge: {
      en: "Voice-First Scholarship Companion • Demo MVP",
      hi: "वॉइस-फर्स्ट छात्रवृत्ति साथी • डेमो MVP",
      bn: "ভয়েস-ফার্স্ট বৃত্তি সাথী • ডেমো MVP",
    },
    title: {
      en: "Hello, Future Scholar!",
      hi: "नमस्ते, भविष्य के विद्वान!",
      bn: "নমস্কার, ভবিষ্যতের মেধাবী!",
    },
    subtitle: {
      en: "Let's find the right scholarship for you.",
      hi: "आइए आपके लिए सही छात्रवृत्ति खोजें।",
      bn: "চলুন আপনার জন্য সঠিক বৃত্তি খুঁজে বের করি।",
    },
    desc: {
      en: "Just speak or type in English, Hindi, or Bengali — I'll guide you through eligibility, documents, and form readiness step by step.",
      hi: "बस बोलें या लिखें — मैं आपको पात्रता, दस्तावेज़ और आवेदन की तैयारी में हर कदम पर मदद करूंगा।",
      bn: "শুধু কথা বলুন বা লিখুন — আমি যোগ্যতা, নথিপত্র এবং আবেদনের প্রস্তুতিতে প্রতিটি ধাপে সাহায্য করব।",
    },
    talkBtn: {
      en: "Talk to FormSaathi",
      hi: "FormSaathi से बात करें",
      bn: "FormSaathi-র সাথে কথা বলুন",
    },
    listeningBtn: {
      en: "Listening... Tap to Stop",
      hi: "सुन रहा हूँ... रोकने के लिए दबाएं",
      bn: "শুনছি... থামাতে ট্যাপ করুন",
    },
    exploreBtn: {
      en: "Explore Demo Scholarships",
      hi: "डेमो छात्रवृत्तियाँ देखें",
      bn: "ডেমো বৃত্তি দেখুন",
    },
  },
  demoBanner: {
    en: "DEMONSTRATION DATA: Scholarships shown below are simulated examples for practice. Always verify live schemes on official portals like scholarships.gov.in.",
    hi: "डेमो डेटा: नीचे दिखाई गई छात्रवृत्तियाँ अभ्यास के लिए सिमुलेटेड उदाहरण हैं। वास्तविक योजनाओं के लिए हमेशा scholarships.gov.in जैसे आधिकारिक पोर्टल देखें।",
    bn: "ডেমো ডেটা: নিচে দেখানো বৃত্তিগুলি অনুশীলনের জন্য সিমুলেটেড উদাহরণ। আসল প্রকল্পের জন্য সর্বদা scholarships.gov.in-এর মতো অফিসিয়াল পোর্টাল দেখুন।",
  },
  privacyBanner: {
    en: "Privacy First: FormSaathi never asks for Aadhaar numbers, bank passwords, or sensitive documents, and never submits forms automatically.",
    hi: "गोपनीयता सर्वोपरि: FormSaathi कभी भी आधार नंबर, बैंक पासवर्ड या संवेदनशील दस्तावेज़ नहीं मांगता और न ही स्वचालित रूप से फॉर्म जमा करता है।",
    bn: "গোপনীয়তা প্রথম: FormSaathi কখনো আধার নম্বর, ব্যাংক পাসওয়ার্ড বা সংবেদনশীল নথি চায় না এবং নিজে থেকে ফর্ম জমা দেয় না।",
  },
  common: {
    checkEligibility: { en: "Check Eligibility", hi: "पात्रता जांचें", bn: "যোগ্যতা যাচাই" },
    viewDetails: { en: "View Details", hi: "विवरण देखें", bn: "বিস্তারিত দেখুন" },
    viewAll: { en: "View All", hi: "सभी देखें", bn: "সব দেখুন" },
    demoTag: { en: "DEMO", hi: "डेमो", bn: "ডেমো" },
    save: { en: "Save", hi: "सहेजें", bn: "সংরক্ষণ করুন" },
    saved: { en: "Saved", hi: "सहेजा गया", bn: "সংরক্ষিত" },
    repeatVoice: { en: "Speak", hi: "सुनें", bn: "শুনুন" },
    stopVoice: { en: "Stop", hi: "रोकें", bn: "থামান" },
    typePlaceholder: {
      en: "Or type your message here...",
      hi: "या यहाँ अपना संदेश लिखें...",
      bn: "অথবা এখানে আপনার বার্তা লিখুন...",
    },
    send: { en: "Send", hi: "भेजें", bn: "পাঠান" },
    confirmYes: { en: "Yes, that's right", hi: "हाँ, यह सही है", bn: "হ্যাঁ, এটাই ঠিক" },
    confirmEdit: { en: "No, let me correct it", hi: "नहीं, मुझे सुधारना है", bn: "না, আমি ঠিক করব" },
  },
  tips: [
    {
      en: "You can prepare documents for multiple scholarships at the same time so you never miss a deadline!",
      hi: "आप एक ही समय में कई छात्रवृत्तियों के लिए दस्तावेज़ तैयार कर सकते हैं ताकि कोई अंतिम तिथि न छूटे!",
      bn: "আপনি একসাথে একাধিক বৃত্তির জন্য নথিপত্র প্রস্তুত রাখতে পারেন যাতে কোনো শেষ তারিখ মিস না হয়!",
    },
    {
      en: "Keep your college bonafide certificate and family income certificate in a clear PDF folder before applying on official portals.",
      hi: "आधिकारिक पोर्टल पर आवेदन करने से पहले अपना कॉलेज बोनाफाइड और आय प्रमाण पत्र एक स्पष्ट PDF फ़ोल्डर में तैयार रखें।",
      bn: "অফিসিয়াল পোর্টালে আবেদনের আগে আপনার কলেজ বোনাফাইড ও আয়ের শংসাপত্র একটি স্পষ্ট পিডিএফ ফোল্ডারে রাখুন।",
    },
    {
      en: "Never share OTPs, bank passwords, or Aadhaar details with third-party agents. Always apply directly on official government portals.",
      hi: "कभी भी किसी तीसरे पक्ष को OTP, बैंक पासवर्ड या आधार विवरण न दें। हमेशा आधिकारिक सरकारी पोर्टल पर स्वयं आवेदन करें।",
      bn: "কখনোই তৃতীয় পক্ষকে ওটিপি, ব্যাংক পাসওয়ার্ড বা আধার তথ্য দেবেন না। সর্বদা অফিসিয়াল সরকারি পোর্টালে নিজে আবেদন করুন।",
    },
  ],
};

export function t(obj: { en: string; hi: string; bn: string }, lang: Language): string {
  return obj[lang] || obj.en;
}
