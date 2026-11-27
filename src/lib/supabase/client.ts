import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const { url, publishableKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return null;
  }
  return createBrowserClient(url, publishableKey);
}
