import { NextResponse } from "next/server";
import { getServerSupabase, isSupabaseConfiguredServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (!isSupabaseConfiguredServer()) {
    return NextResponse.json(
      { ok: false, reason: "supabase_not_configured" },
      { status: 200 },
    );
  }

  const body = await req.json();
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("games")
    .insert({ ...body, user_id: user.user.id })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
