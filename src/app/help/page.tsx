"use client";

import React, { useEffect, useState } from "react";
import { HelpCircle, Mic, ShieldCheck, ExternalLink, Search, ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { t, UI_TEXT } from "@/lib/i18n";
import { getSpeechRecognitionConstructor, isSpeechSynthesisSupported } from "@/lib/voiceEngine";

const FAQS = [
  {
    q: {
      en: "Are the scholarships shown in FormSaathi real or demonstration data?",
      hi: "क्या FormSaathi में दिखाई गई छात्रवृत्तियाँ वास्तविक हैं या डेमो डेटा?",
      bn: "FormSaathi-তে দেখানো বৃত্তিগুলি কি আসল নাকি ডেমো ডেটা?",
    },
    a: {
      en: "All scholarships in this MVP are clearly labelled DEMONSTRATION entries so you can practice eligibility matching and document preparation safely. Always verify live schemes on official portals like scholarships.gov.in.",
      hi: "इस MVP में सभी छात्रवृत्तियाँ स्पष्ट रूप से डेमो (DEMONSTRATION) प्रविष्टियाँ हैं ताकि आप सुरक्षित रूप से अभ्यास कर सकें। वास्तविक योजनाओं के लिए हमेशा scholarships.gov.in जैसे आधिकारिक पोर्टल देखें।",
      bn: "এই MVP-র সব বৃত্তি স্পষ্টভাবে ডেমো (DEMONSTRATION) হিসেবে চিহ্নিত, যাতে আপনি নিরাপদে অনুশীলন করতে পারেন। আসল প্রকল্পের জন্য সর্বদা scholarships.gov.in-এর মতো অফিসিয়াল পোর্টাল দেখুন।",
    },
  },
  {
    q: {
      en: "What if voice recognition does not work in my browser?",
      hi: "यदि मेरे ब्राउज़र में वॉइस रिकग्निशन काम न करे तो क्या करें?",
      bn: "আমার ব্রাউজারে ভয়েস রিকগনিশন কাজ না করলে কী করব?",
    },
    a: {
      en: "Web Speech API works best in Google Chrome or Microsoft Edge. If your browser does not support it or microphone permission is blocked, FormSaathi automatically lets you type your answers instead.",
      hi: "Web Speech API Google Chrome या Microsoft Edge में सबसे अच्छा काम करता है। यदि आपका ब्राउज़र इसका समर्थन नहीं करता या माइक्रोफ़ोन की अनुमति नहीं है, तो आप नीचे टाइप कर सकते हैं।",
      bn: "Web Speech API Google Chrome বা Microsoft Edge-এ সবচেয়ে ভালো কাজ করে। যদি আপনার ব্রাউজারে এটি সমর্থিত না হয়, তবে আপনি সহজেই নিচে টাইপ করে উত্তর দিতে পারবেন।",
    },
  },
  {
    q: {
      en: "Does FormSaathi collect my Aadhaar number or bank details?",
      hi: "क्या FormSaathi मेरा आधार नंबर या बैंक विवरण एकत्र करता है?",
      bn: "FormSaathi কি আমার আধার নম্বর বা ব্যাংক তথ্য সংগ্রহ করে?",
    },
    a: {
      en: "No! FormSaathi never asks for Aadhaar numbers, bank credentials, passwords, or sensitive documents, and never submits applications automatically.",
      hi: "नहीं! FormSaathi कभी भी आधार नंबर, बैंक विवरण, पासवर्ड या संवेदनशील दस्तावेज़ नहीं मांगता और न ही अपने आप फॉर्म जमा करता है।",
      bn: "না! FormSaathi কখনোই আধার নম্বর, ব্যাংক তথ্য, পাসওয়ার্ড বা সংবেদনশীল নথি চায় না এবং নিজে থেকে আবেদন জমা দেয় না।",
    },
  },
];

export default function HelpPage() {
  const { lang } = useApp();
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [voiceDiag, setVoiceDiag] = useState<{ rec: boolean; synth: boolean }>({
    rec: true,
    synth: true,
  });

  useEffect(() => {
    setVoiceDiag({
      rec: Boolean(getSpeechRecognitionConstructor()),
      synth: isSpeechSynthesisSupported(),
    });
  }, []);

  const filteredFaqs = FAQS.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t(item.q, lang).toLowerCase().includes(q) ||
      t(item.a, lang).toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-950">
          {t(UI_TEXT.nav.help, lang)}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Guides for voice interaction, privacy safety, and official scholarship portals.
        </p>
      </div>

      {/* Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white border border-indigo-100 p-5 shadow-xs space-y-2">
          <h2 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
            <Mic className="w-4 h-4 text-indigo-600" />
            Voice Assistant Tips
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Use Chrome or Edge on desktop/Android for best Hindi, Bengali, and English
            speech recognition. Speak clearly after tapping the microphone button, and
            always review the confirmation card before saving details.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                voiceDiag.rec
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              Speech Input: {voiceDiag.rec ? "Supported" : "Fallback to Text"}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                voiceDiag.synth
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              Spoken Output: {voiceDiag.synth ? "Supported" : "Unavailable"}
            </span>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-indigo-100 p-5 shadow-xs space-y-2">
          <h2 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Official Portals &amp; Safety
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            When you are ready to apply for real government scholarships, visit the
            official National Scholarship Portal directly:
          </p>
          <a
            href="https://scholarships.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline pt-1"
          >
            scholarships.gov.in (Official NSP)
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Searchable FAQs */}
      <section className="rounded-3xl bg-white border border-indigo-100 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-indigo-950 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-violet-600" />
            Frequently Asked Questions
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-indigo-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-2xl bg-indigo-50/40 border border-indigo-100 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <span className="text-sm font-bold text-indigo-950">
                    {t(faq.q, lang)}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-indigo-600 shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {t(faq.a, lang)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
