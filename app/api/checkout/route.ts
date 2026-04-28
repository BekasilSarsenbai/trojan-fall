import { NextResponse } from "next/server";
import { getStripe, getPackage, isStripeConfigured } from "@/lib/stripe";
import { getServerSupabase, isSupabaseConfiguredServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "stripe_not_configured", hint: "Add STRIPE_SECRET_KEY to .env.local" },
      { status: 200 },
    );
  }
  if (!isSupabaseConfiguredServer()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const packageId = body?.packageId as string | undefined;
  if (!packageId) return NextResponse.json({ ok: false, error: "missing_package" }, { status: 400 });

  const pkg = getPackage(packageId);
  if (!pkg) return NextResponse.json({ ok: false, error: "invalid_package" }, { status: 400 });

  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "no_supabase" }, { status: 500 });
  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp.user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, error: "no_stripe" }, { status: 500 });

  const url = new URL(req.url);
  const origin = `${url.protocol}//${url.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Trojan Fall — ${pkg.ducats} дукатов`,
              description: pkg.label,
            },
            unit_amount: pkg.priceCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/shop?success=true&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop?canceled=true`,
      metadata: {
        userId: userResp.user.id,
        ducats: String(pkg.ducats),
        packageId: pkg.id,
      },
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "stripe_error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
