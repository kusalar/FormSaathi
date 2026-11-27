"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityItem,
  ApplicationTrackingItem,
  ApplicationTrackingStatus,
  Language,
  LocalizedText,
  Scholarship,
  StudentProfile,
  ToastItem,
  VoiceMessage,
} from "@/types";
import {
  buildMatchedScholarshipsList,
  generateAssistantReply,
  getNextMissingQuestion,
  isAffirmativeReply,
  isNegativeReply,
  speakText,
  stopSpeaking,
} from "@/lib/voiceEngine";
import { SCHOLARSHIPS } from "@/lib/scholarships";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  deleteCloudOpportunityTracking,
  loadCloudUserData,
  syncCloudCheckedDocs,
  syncCloudSavedOpportunity,
  upsertCloudOpportunityTracking,
  upsertCloudProfile,
} from "@/lib/supabase/db";

interface AuthUserSummary {
  id: string;
  email?: string;
}

interface AppState {
  lang: Language;
  setLang: (lang: Language) => void;
  profile: StudentProfile;
  updateProfile: (updates: Partial<StudentProfile>) => void;
  checkedDocs: Record<string, boolean>;
  toggleDoc: (docId: string) => void;
  savedScholarships: string[];
  toggleSaveScholarship: (id: string) => void;
  applicationTracking: Record<string, ApplicationTrackingItem>;
  updateOpportunityTracking: (
    opportunityId: string,
    opportunityTitle: string,
    status: ApplicationTrackingStatus,
    notes?: string
  ) => void;
  removeOpportunityTracking: (opportunityId: string) => void;
  messages: VoiceMessage[];
  sendMessage: (text: string) => void;
  confirmPendingDetails: (messageId: string, accept: boolean) => void;
  clearMessages: () => void;
  autoSpeak: boolean;
  setAutoSpeak: (val: boolean) => void;
  isSpeaking: boolean;
  speakMessage: (text: string, msgLang?: Language) => void;
  stopVoice: () => void;
  resetProfile: () => void;
  resetChecklist: () => void;
  toasts: ToastItem[];
  showToast: (title: string, description?: string, type?: ToastItem["type"]) => void;
  dismissToast: (id: string) => void;
  selectedScholarship: Scholarship | null;
  setSelectedScholarship: (s: Scholarship | null) => void;
  activities: ActivityItem[];
  logActivity: (label: LocalizedText, href: string) => void;
  overallProgress: number;
  profileCompleteness: number;
  docProgress: number;
  user: AuthUserSummary | null;
  supabaseConfigured: boolean;
  cloudSyncStatus: "idle" | "saving" | "synced" | "error";
  cloudSyncError: string | null;
  pendingLocalMigration: boolean;
  migrateLocalToSupabase: () => Promise<void>;
  dismissLocalMigration: () => void;
  signOut: () => Promise<void>;
}

const DEFAULT_PROFILE: StudentProfile = {
  name: "GUEST",
  collegeName: "",
  course: "",
  branch: "",
  year: "",
  graduationYear: "",
  institutionType: "",
  annualIncome: "",
  state: "",
  category: "",
  firstGen: true,
  skills: "",
  preferredCategories: [],
  preferredWorkMode: "",
};

function getInitialGreeting(lang: Language): VoiceMessage {
  const text =
    lang === "hi"
      ? "नमस्ते! मैं आपका FormSaathi सहायक हूँ। आज मैं आपकी छात्रवृत्ति खोजने या दस्तावेज़ तैयार करने में कैसे मदद कर सकता हूँ?"
      : lang === "bn"
      ? "নমস্কার! আমি আপনার FormSaathi সহায়ক। আজ আমি আপনাকে বৃত্তি খুঁজতে বা নথিপত্র প্রস্তুত করতে কীভাবে সাহায্য করতে পারি?"
      : "Namaste! I am your FormSaathi assistant. Tell me what you are studying, or tap a quick option below to get started.";

  return {
    id: "greeting-1",
    role: "assistant",
    lang,
    text,
    timestamp: "Now",
    actions: [
      {
        label: lang === "hi" ? "छात्रवृत्ति खोजें" : lang === "bn" ? "বৃত্তি খুঁজুন" : "Find scholarships",
        href: "/scholarships",
      },
      {
        label: lang === "hi" ? "मेरी पात्रता जांचें" : lang === "bn" ? "যোগ্যতা যাচাই করুন" : "Check my eligibility",
        href: "/eligibility",
      },
      {
        label: lang === "hi" ? "दस्तावेज़ सूची देखें" : lang === "bn" ? "নথিপত্র তালিকা দেখুন" : "View document checklist",
        href: "/documents",
      },
      {
        label: lang === "hi" ? "आवेदन में मदद" : lang === "bn" ? "আবেদনে সাহায্য" : "Help with application",
        promptText: "I am a third-year B.Tech student. I want to find scholarships I can apply for.",
      },
    ],
  };
}

const AppContext = createContext<AppState | null>(null);
const STORAGE_KEY = "formsaathi_state_v1";

let uidCounter = 0;
function nextUid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${uidCounter}`;
}

function formatNowTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_PROFILE);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [savedScholarships, setSavedScholarships] = useState<string[]>(["demo-central-sector"]);
  const [applicationTracking, setApplicationTracking] = useState<
    Record<string, ApplicationTrackingItem>
  >({});
  const [messages, setMessages] = useState<VoiceMessage[]>([getInitialGreeting("en")]);
  const [pendingUpdatesMap, setPendingUpdatesMap] = useState<Record<string, Partial<StudentProfile>>>({});
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [user, setUser] = useState<AuthUserSummary | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<
    "idle" | "saving" | "synced" | "error"
  >("idle");
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
  const [pendingLocalMigration, setPendingLocalMigration] = useState<boolean>(false);
  const supabaseConfigured = isSupabaseConfigured();
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: "act-1",
      label: {
        en: "Started FormSaathi Scholarship Journey",
        hi: "FormSaathi छात्रवृत्ति यात्रा शुरू की",
        bn: "FormSaathi বৃত্তি যাত্রা শুরু হয়েছে",
      },
      timestamp: "Just now",
      href: "/",
    },
  ]);

  // Hydrate from localStorage on client
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed.lang) setLangState(parsed.lang);
        if (parsed.profile) setProfile({ ...DEFAULT_PROFILE, ...parsed.profile });
        if (parsed.checkedDocs) setCheckedDocs(parsed.checkedDocs);
        if (parsed.savedScholarships) setSavedScholarships(parsed.savedScholarships);
        if (parsed.applicationTracking) setApplicationTracking(parsed.applicationTracking);
        if (typeof parsed.autoSpeak === "boolean") setAutoSpeak(parsed.autoSpeak);
        if (Array.isArray(parsed.activities) && parsed.activities.length > 0) {
          setActivities(parsed.activities);
        }
      } catch {
        // Ignore corrupt storage
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lang,
          profile,
          checkedDocs,
          savedScholarships,
          applicationTracking,
          autoSpeak,
          activities: activities.slice(0, 12),
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [lang, profile, checkedDocs, savedScholarships, applicationTracking, autoSpeak, activities]);

  // Sync with Supabase Auth & Database when configured
  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createSupabaseClient();
    if (!supabase) return;

    const hydrateFromCloud = async (
      authUser: AuthUserSummary,
      metaFullName?: string
    ) => {
      setUser(authUser);
      setCloudSyncError(null);
      try {
        const cloud = await loadCloudUserData(supabase, authUser.id);
        const cloudHasProfile = Boolean(
          cloud.profile.course || cloud.profile.year || cloud.profile.state
        );
        const resolvedName = cloud.profile.name || metaFullName || "";
        if (cloudHasProfile || resolvedName) {
          setProfile((prev) => ({
            ...prev,
            ...cloud.profile,
            ...(resolvedName ? { name: resolvedName } : {}),
          }));
        }
        if (cloud.lang) setLangState(cloud.lang);
        if (cloud.savedScholarships.length > 0) {
          setSavedScholarships(cloud.savedScholarships);
        }
        if (Object.keys(cloud.checkedDocs).length > 0) {
          setCheckedDocs(cloud.checkedDocs);
        }
        if (Object.keys(cloud.applicationTracking).length > 0) {
          setApplicationTracking(cloud.applicationTracking);
        }
        setCloudSyncStatus("synced");

        // Check if explicit one-time localStorage migration should be offered
        const migratedFlag = window.localStorage.getItem(
          `formsaathi_migrated_${authUser.id}`
        );
        const localRaw = window.localStorage.getItem(STORAGE_KEY);
        if (!migratedFlag && localRaw && !cloudHasProfile) {
          const parsed = JSON.parse(localRaw);
          const p = parsed?.profile;
          if (p && (p.course || p.year || p.state || p.annualIncome)) {
            setPendingLocalMigration(true);
          }
        }
      } catch (err) {
        setCloudSyncStatus("error");
        setCloudSyncError(
          err instanceof Error ? err.message : "Could not load cloud profile."
        );
      }
    };

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const metaName =
          typeof data.user.user_metadata?.full_name === "string"
            ? data.user.user_metadata.full_name
            : undefined;
        hydrateFromCloud({ id: data.user.id, email: data.user.email }, metaName);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const metaName =
          typeof session.user.user_metadata?.full_name === "string"
            ? session.user.user_metadata.full_name
            : undefined;
        hydrateFromCloud(
          { id: session.user.id, email: session.user.email },
          metaName
        );
      } else {
        setUser(null);
        setCloudSyncStatus("idle");
        setCloudSyncError(null);
        setPendingLocalMigration(false);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [supabaseConfigured]);

  const showToast = (title: string, description?: string, type: ToastItem["type"] = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logActivity = (label: LocalizedText, href: string) => {
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        label,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        href,
      },
      ...prev.slice(0, 11),
    ]);
  };

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "greeting-1") {
        return [getInitialGreeting(newLang)];
      }
      return prev;
    });
    const langName = newLang === "hi" ? "हिन्दी (Hindi)" : newLang === "bn" ? "বাংলা (Bengali)" : "English";
    showToast(`Language switched to ${langName}`, undefined, "success");
  };

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile((prev) => {
      const merged = { ...prev, ...updates };
      if (user && supabaseConfigured) {
        const supabase = createSupabaseClient();
        if (supabase) {
          setCloudSyncStatus("saving");
          setCloudSyncError(null);
          void upsertCloudProfile(supabase, user.id, merged, lang).then((res) => {
            if (res.ok) {
              setCloudSyncStatus("synced");
            } else {
              setCloudSyncStatus("error");
              setCloudSyncError(res.error || "Failed to save profile to cloud.");
              showToast("Cloud sync error", res.error || "Saved locally only.", "warning");
            }
          });
        }
      }
      return merged;
    });
  };

  const toggleDoc = (docId: string) => {
    setCheckedDocs((prev) => {
      const updated = { ...prev, [docId]: !prev[docId] };
      if (user && supabaseConfigured) {
        const supabase = createSupabaseClient();
        if (supabase) {
          void syncCloudCheckedDocs(supabase, user.id, updated).then((res) => {
            if (!res.ok) {
              showToast("Checklist sync warning", res.error, "warning");
            }
          });
        }
      }
      return updated;
    });
  };

  const toggleSaveScholarship = (id: string) => {
    setSavedScholarships((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      if (user && supabaseConfigured) {
        const supabase = createSupabaseClient();
        if (supabase) {
          void syncCloudSavedOpportunity(supabase, user.id, id, !exists).then((res) => {
            if (!res.ok) {
              showToast("Bookmark sync warning", res.error, "warning");
            }
          });
        }
      }
      showToast(
        exists ? "Removed from saved list" : "Saved opportunity to your list",
        undefined,
        exists ? "info" : "success"
      );
      return next;
    });
  };

  const updateOpportunityTracking = (
    opportunityId: string,
    opportunityTitle: string,
    status: ApplicationTrackingStatus,
    notes?: string
  ) => {
    setApplicationTracking((prev) => {
      const existing = prev[opportunityId];
      const nextItem: ApplicationTrackingItem = {
        opportunityId,
        opportunityTitle,
        status,
        notes: notes !== undefined ? notes : existing?.notes || "",
        updatedAt: new Date().toISOString(),
      };
      if (user && supabaseConfigured) {
        const supabase = createSupabaseClient();
        if (supabase) {
          void upsertCloudOpportunityTracking(supabase, user.id, nextItem).then((res) => {
            if (!res.ok) {
              showToast("Tracking sync warning", res.error, "warning");
            }
          });
        }
      }
      showToast(`Status updated: ${status}`, opportunityTitle, "success");
      return { ...prev, [opportunityId]: nextItem };
    });
  };

  const removeOpportunityTracking = (opportunityId: string) => {
    setApplicationTracking((prev) => {
      const next = { ...prev };
      delete next[opportunityId];
      if (user && supabaseConfigured) {
        const supabase = createSupabaseClient();
        if (supabase) {
          void deleteCloudOpportunityTracking(supabase, user.id, opportunityId);
        }
      }
      return next;
    });
  };

  const migrateLocalToSupabase = async () => {
    if (!user || !supabaseConfigured) return;
    const supabase = createSupabaseClient();
    if (!supabase) return;
    setCloudSyncStatus("saving");
    const profRes = await upsertCloudProfile(supabase, user.id, profile, lang);
    const docsRes = await syncCloudCheckedDocs(supabase, user.id, checkedDocs);
    for (const sId of savedScholarships) {
      await syncCloudSavedOpportunity(supabase, user.id, sId, true);
    }
    if (!profRes.ok || !docsRes.ok) {
      setCloudSyncStatus("error");
      showToast("Migration incomplete", profRes.error || docsRes.error, "warning");
      return;
    }
    setCloudSyncStatus("synced");
    window.localStorage.setItem(`formsaathi_migrated_${user.id}`, "true");
    setPendingLocalMigration(false);
    showToast("Data imported", "Your local profile & checklist are now saved to your account.", "success");
  };

  const dismissLocalMigration = () => {
    if (user) {
      window.localStorage.setItem(`formsaathi_migrated_${user.id}`, "dismissed");
    }
    setPendingLocalMigration(false);
  };

  const signOut = async () => {
    const supabase = createSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(DEFAULT_PROFILE);
    setPendingLocalMigration(false);
    showToast("Signed out", "You are now in GUEST demo mode.", "info");
  };

  const speakMessage = (text: string, msgLang?: Language) => {
    const started = speakText(text, msgLang || lang, () => setIsSpeaking(false));
    if (started) setIsSpeaking(true);
  };

  const stopVoice = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
    showToast("Profile reset", "Demo profile fields have been cleared.", "info");
  };

  const resetChecklist = () => {
    setCheckedDocs({});
    showToast("Checklist reset", "All document checkboxes cleared.", "info");
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Check if there is an unconfirmed confirmation message waiting for yes/no
    const lastPending = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.confirmation && !m.confirmation.confirmed);

    if (lastPending && (isAffirmativeReply(trimmed) || isNegativeReply(trimmed))) {
      const userMsg: VoiceMessage = {
        id: nextUid("user"),
        role: "user",
        lang,
        text: trimmed,
        timestamp: formatNowTime(),
      };
      setMessages((prev) => [...prev, userMsg]);
      confirmPendingDetails(lastPending.id, isAffirmativeReply(trimmed));
      return;
    }

    const userMsg: VoiceMessage = {
      id: nextUid("user"),
      role: "user",
      lang,
      text: trimmed,
      timestamp: formatNowTime(),
    };

    const { reply, detectedUpdates } = generateAssistantReply(trimmed, profile, lang);
    const assistantId = nextUid("asst");
    const assistantMsg: VoiceMessage = {
      ...reply,
      id: assistantId,
      timestamp: formatNowTime(),
    };

    if (Object.keys(detectedUpdates).length > 0) {
      setPendingUpdatesMap((prev) => ({ ...prev, [assistantId]: detectedUpdates }));
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    if (autoSpeak) {
      speakMessage(assistantMsg.text, lang);
    }
  };

  const confirmPendingDetails = (messageId: string, accept: boolean) => {
    const updates = pendingUpdatesMap[messageId];
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.confirmation
          ? { ...m, confirmation: { ...m.confirmation, confirmed: true } }
          : m
      )
    );

    if (accept && updates) {
      const mergedProfile = { ...profile, ...updates };
      setProfile(mergedProfile);
      logActivity(
        {
          en: "Confirmed profile details via Voice Assistant",
          hi: "वॉइस सहायक से प्रोफ़ाइल विवरण की पुष्टि की",
          bn: "ভয়েস সহায়কের মাধ্যমে প্রোফাইল তথ্য নিশ্চিত করেছেন",
        },
        "/profile"
      );
      showToast("Profile updated", "Your confirmed details were saved.", "success");

      // Ask the next missing question one at a time, or show matched demo scholarships!
      const nextQ = getNextMissingQuestion(mergedProfile, lang);
      const matchedList = !nextQ ? buildMatchedScholarshipsList(mergedProfile, lang) : undefined;
      const followUpText = nextQ
        ? nextQ.question
        : lang === "hi"
        ? `बहुत बढ़िया! आपकी मुख्य जानकारी पूरी हो गई है। आपकी प्रोफ़ाइल से ${matchedList?.length ?? 0} डेमो छात्रवृत्तियाँ मेल खाती हैं:`
        : lang === "bn"
        ? `দারুণ! আপনার মূল তথ্য সম্পন্ন হয়েছে। আপনার প্রোফাইলের সাথে ${matchedList?.length ?? 0}টি ডেমো বৃত্তি মিলেছে:`
        : `Saved! Your eligibility profile is complete. Based on your details, ${matchedList?.length ?? 0} demonstration scholarships may match:`;

      const followUpMsg: VoiceMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        lang,
        text: followUpText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        matchedScholarships: matchedList,
        actions: nextQ
          ? nextQ.quickReplies.slice(0, 4).map((q) => ({ label: q, promptText: q }))
          : [{ label: "Browse All Scholarships", href: "/scholarships" }],
      };

      setMessages((prev) => [...prev, followUpMsg]);
      if (autoSpeak) speakMessage(followUpMsg.text, lang);
    } else {
      const retryText =
        lang === "hi"
          ? "कोई बात नहीं! कृपया सही जानकारी बोलें या लिखें (जैसे: मैं B.Sc दूसरे वर्ष में हूँ)।"
          : lang === "bn"
          ? "কোনো সমস্যা নেই! অনুগ্রহ করে সঠিক তথ্য বলুন বা লিখুন (যেমন: আমি B.Sc দ্বিতীয় বর্ষে পড়ি)।"
          : "No problem! Please speak or type the corrected detail so I don't save anything wrong.";

      const retryMsg: VoiceMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        lang,
        text: retryText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, retryMsg]);
      if (autoSpeak) speakMessage(retryMsg.text, lang);
    }
  };

  const clearMessages = () => {
    setMessages([getInitialGreeting(lang)]);
    setPendingUpdatesMap({});
  };

  // Compute progress metrics
  const profileCompleteness = useMemo(() => {
    const fields = [
      profile.name,
      profile.course,
      profile.year,
      profile.institutionType,
      profile.annualIncome,
      profile.state,
    ];
    const filled = fields.filter((f) => Boolean(f && f.trim())).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const docProgress = useMemo(() => {
    const uniqueDocIds = Array.from(
      new Set(SCHOLARSHIPS.flatMap((s) => s.requiredDocuments.map((d) => d.id)))
    );
    if (uniqueDocIds.length === 0) return 0;
    const done = uniqueDocIds.filter((id) => checkedDocs[id]).length;
    return Math.round((done / uniqueDocIds.length) * 100);
  }, [checkedDocs]);

  const overallProgress = useMemo(() => {
    const savedScore = savedScholarships.length > 0 ? 100 : 0;
    return Math.round(profileCompleteness * 0.45 + docProgress * 0.35 + savedScore * 0.2);
  }, [profileCompleteness, docProgress, savedScholarships.length]);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        profile,
        updateProfile,
        checkedDocs,
        toggleDoc,
        savedScholarships,
        toggleSaveScholarship,
        applicationTracking,
        updateOpportunityTracking,
        removeOpportunityTracking,
        messages,
        sendMessage,
        confirmPendingDetails,
        clearMessages,
        autoSpeak,
        setAutoSpeak,
        isSpeaking,
        speakMessage,
        stopVoice,
        resetProfile,
        resetChecklist,
        toasts,
        showToast,
        dismissToast,
        selectedScholarship,
        setSelectedScholarship,
        activities,
        logActivity,
        overallProgress,
        profileCompleteness,
        docProgress,
        user,
        supabaseConfigured,
        cloudSyncStatus,
        cloudSyncError,
        pendingLocalMigration,
        migrateLocalToSupabase,
        dismissLocalMigration,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
