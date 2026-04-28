import { NextResponse } from "next/server";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  }
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ ok: false, error: "supabase_admin_missing" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ ok: false, error: "no_signature" }, { status: 400 });

  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "bad_signature";
    return NextResponse.json({ ok: false, error: `webhook_${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      metadata?: { userId?: string; ducats?: string };
      amount_total?: number | null;
    };
    const userId = session.metadata?.userId;
    const ducats = parseInt(session.metadata?.ducats ?? "0", 10);
    if (!userId || !ducats) {
      return NextResponse.json({ ok: false, error: "missing_metadata" }, { status: 400 });
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
    const { error } = await admin.rpc("credit_stripe_ducats", {
      p_user_id: userId,
      p_amount: ducats,
      p_session_id: session.id,
      p_amount_cents: session.amount_total ?? 0,
    });
    if (error) {
      console.error("[stripe-webhook] credit error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, received: true });
}

export const runtime = "nodejs";
