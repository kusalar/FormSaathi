export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "";

  const isConfigured =
    Boolean(url) &&
    Boolean(publishableKey) &&
    (url.startsWith("https://") || url.startsWith("http://"));

  return { url, publishableKey, isConfigured };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}
