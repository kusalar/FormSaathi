import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const authError = searchParams.get("error");
  const rawNext = searchParams.get("next") ?? "/profile";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/profile";

  if (authError) {
    return NextResponse.redirect(`${origin}/login?error=link_expired`);
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      return NextResponse.redirect(`${origin}/login?error=link_expired`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
