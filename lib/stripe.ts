import Stripe from "stripe";

export const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
export const STRIPE_PUBLISHABLE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export interface DucatPackage {
  id: string;
  ducats: number;
  priceCents: number;
  label: string;
  best?: boolean;
}

export const DUCAT_PACKAGES: DucatPackage[] = [
  { id: "pack_100",  ducats: 100,  priceCents:  99, label: "Стартовый" },
  { id: "pack_500",  ducats: 500,  priceCents: 399, label: "Боевой" },
  { id: "pack_1200", ducats: 1200, priceCents: 799, label: "Командирский", best: true },
  { id: "pack_3000", ducats: 3000, priceCents: 1499, label: "Генеральский" },
];

export function getPackage(id: string): DucatPackage | undefined {
  return DUCAT_PACKAGES.find((p) => p.id === id);
}

export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_SECRET);
}

let _stripe: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!STRIPE_SECRET) return null;
  if (!_stripe) {
    _stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2024-11-20.acacia" as Stripe.LatestApiVersion });
  }
  return _stripe;
}
