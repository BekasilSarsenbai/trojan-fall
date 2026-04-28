import { NextResponse } from "next/server";
import { getServerSupabase, isSupabaseConfiguredServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfiguredServer()) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  const supabase = getServerSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
