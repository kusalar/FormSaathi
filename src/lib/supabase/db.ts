import type { SupabaseClient } from "@supabase/supabase-js";
import { Language, StudentProfile } from "@/types";

export interface CloudUserData {
  profile: Partial<StudentProfile>;
  lang?: Language;
  savedScholarships: string[];
  checkedDocs: Record<string, boolean>;
}

export async function loadCloudUserData(
  supabase: SupabaseClient,
  userId: string
): Promise<CloudUserData> {
  const [profileRes, prefsRes, savedRes, trackingRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("student_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("saved_opportunities").select("scholarship_id").eq("user_id", userId),
    supabase.from("application_tracking").select("scholarship_id, checked_docs").eq("user_id", userId),
  ]);

  const mergedProfile: Partial<StudentProfile> = {};
  if (profileRes.data) {
    if (profileRes.data.full_name) mergedProfile.name = profileRes.data.full_name;
    if (typeof profileRes.data.first_gen === "boolean") {
      mergedProfile.firstGen = profileRes.data.first_gen;
    }
  }
  if (prefsRes.data) {
    if (prefsRes.data.course) mergedProfile.course = prefsRes.data.course;
    if (prefsRes.data.study_year) mergedProfile.year = prefsRes.data.study_year;
    if (prefsRes.data.institution_type) {
      mergedProfile.institutionType = prefsRes.data.institution_type;
    }
    if (prefsRes.data.annual_income) mergedProfile.annualIncome = prefsRes.data.annual_income;
    if (prefsRes.data.state) mergedProfile.state = prefsRes.data.state;
    if (prefsRes.data.category) mergedProfile.category = prefsRes.data.category;
  }

  const savedScholarships = (savedRes.data || []).map((r) => r.scholarship_id);
  const checkedDocs: Record<string, boolean> = {};
  for (const row of trackingRes.data || []) {
    if (row.checked_docs && typeof row.checked_docs === "object") {
      Object.assign(checkedDocs, row.checked_docs);
    }
  }

  const lang = profileRes.data?.preferred_language as Language | undefined;

  return { profile: mergedProfile, lang, savedScholarships, checkedDocs };
}

export async function upsertCloudProfile(
  supabase: SupabaseClient,
  userId: string,
  profile: StudentProfile,
  lang: Language
) {
  await Promise.all([
    supabase.from("profiles").upsert({
      id: userId,
      full_name: profile.name,
      first_gen: profile.firstGen,
      preferred_language: lang,
      updated_at: new Date().toISOString(),
    }),
    supabase.from("student_preferences").upsert({
      user_id: userId,
      course: profile.course,
      study_year: profile.year,
      institution_type: profile.institutionType,
      annual_income: profile.annualIncome,
      state: profile.state,
      category: profile.category,
      updated_at: new Date().toISOString(),
    }),
  ]);
}

export async function syncCloudSavedOpportunity(
  supabase: SupabaseClient,
  userId: string,
  scholarshipId: string,
  shouldSave: boolean
) {
  if (shouldSave) {
    await supabase
      .from("saved_opportunities")
      .upsert(
        { user_id: userId, scholarship_id: scholarshipId },
        { onConflict: "user_id,scholarship_id" }
      );
  } else {
    await supabase
      .from("saved_opportunities")
      .delete()
      .eq("user_id", userId)
      .eq("scholarship_id", scholarshipId);
  }
}

export async function syncCloudCheckedDocs(
  supabase: SupabaseClient,
  userId: string,
  checkedDocs: Record<string, boolean>
) {
  await supabase.from("application_tracking").upsert(
    {
      user_id: userId,
      scholarship_id: "global-checklist",
      status: "preparing",
      checked_docs: checkedDocs,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,scholarship_id" }
  );
}
