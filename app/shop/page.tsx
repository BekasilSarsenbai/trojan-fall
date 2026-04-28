"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useWallet } from "@/hooks/useWallet";
import { useInventory } from "@/hooks/useInventory";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { SHOP_ITEMS, ShopItem } from "@/lib/shop/items";
import { DUCAT_PACKAGES } from "@/lib/stripe";
import { PanelHeader } from "@/components/ui/PanelHeader";
import {
  Coins,
  Lightbulb,
  Shield,
  Zap,
  Square,
  Crown,
  Loader2,
  AlertTriangle,
  LogIn,
  CheckCircle2,
  Lock,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb,
  Shield,
  Zap,
  Square,
  Crown,
};

const CATEGORIES: { key: ShopItem["category"]; label: string }[] = [
  { key: "consumable", label: "Расходники" },
  { key: "boost",      label: "Бусты" },
  { key: "skin",       label: "Скины доски" },
  { key: "avatar",     label: "Аватары" },
];

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 text-war-gold animate-spin" /></div>}>
      <ShopInner />
    </Suspense>
  );
}

function ShopInner() {
  const params = useSearchParams();
  const success = params.get("success") === "true";
  const canceled = params.get("canceled") === "true";
  const { user, loading: authLoading } = useAuth();
  const { balance } = useWallet();
  const { activeSkin, owns, qty, refresh } = useInventory();
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ key: string; text: string; ok: boolean } | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (success) {
      setToast({ text: "🪙 Дукаты зачислены! Удачи в бою.", ok: true });
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
    if (canceled) {
      setToast({ text: "Покупка отменена.", ok: false });
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success, canceled]);

  // Buy disabled — Stripe not yet configured. Silent no-op.
  function buyPackage() {
    // intentionally no-op
  }

  async function buy(item: ShopItem) {
    setFeedback(null);
    if (!user) return;
    if (item.price > 0 && (balance ?? 0) < item.price) {
      setFeedback({ key: item.key, text: "Недостаточно дукатов", ok: false });
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(item.key);
    const { error } = await supabase.rpc("buy_item", {
      p_item_key: item.key,
      p_price: item.price,
      p_quantity: 1,
    });
    if (error) {
      setFeedback({ key: item.key, text: translateBuyError(error.message), ok: false });
    } else {
      setFeedback({ key: item.key, text: "Куплено!", ok: true });
      await refresh();
    }
    setBusy(null);
    setTimeout(() => setFeedback(null), 2500);
  }

  async function equip(item: ShopItem) {
    if (!user) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(item.key);
    const { error } = await supabase.rpc("equip_skin", { p_skin_key: item.key });
    if (error) setFeedback({ key: item.key, text: error.message, ok: false });
    else {
      setFeedback({ key: item.key, text: "Скин активирован", ok: true });
      await refresh();
    }
    setBusy(null);
    setTimeout(() => setFeedback(null), 2500);
  }

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-war-gold animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <ShoppingBag className="w-10 h-10 text-war-gold mb-2" />
        <div className="font-display font-bold text-war-text mb-1">Магазин для командиров</div>
        <p className="text-war-muted text-sm mb-4 max-w-md">
          Чтобы покупать снаряжение, нужно войти в систему.
        </p>
        <Link href="/auth/login?next=/shop" className="btn-primary">
          <LogIn className="w-4 h-4" /> Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 panel liquid-glass px-4 py-3 flex items-center gap-2 max-w-sm shadow-panel ${
            toast.ok ? "border-emerald-500/50" : "border-war-red/50"
          } border-2 animate-fadeInUp`}
        >
          <span className={`text-sm ${toast.ok ? "text-emerald-300" : "text-war-red"}`}>
            {toast.text}
          </span>
          <button onClick={() => setToast(null)} className="text-war-muted hover:text-war-text">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="label-gold flex items-center gap-1">
            <Coins className="w-3 h-3" /> Военный магазин
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-wider mt-1">
            QUARTERMASTER
          </h1>
          <p className="text-war-muted text-sm mt-1">
            Дукаты — боевая валюта Trojan Fall. Купи или заработай в бою.
          </p>
        </div>
        <div className="panel px-4 py-2.5 flex items-center gap-2">
          <Coins className="w-4 h-4 text-war-gold" />
          <div>
            <div className="label text-[9px]">Баланс</div>
            <div className="text-war-gold font-display font-black text-2xl">
              {balance ?? "—"} <span className="text-base">Δ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe packages */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3 h-3 text-war-gold" />
          <span className="label text-[11px]">Пополнить баланс</span>
        </div>
        <p className="text-war-muted text-sm mb-4">Купи дукаты — используй в игре.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {DUCAT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`panel p-4 transition-all flex flex-col ${
                pkg.best ? "neon-frame-gold" : "hover:border-war-gold/40"
              }`}
            >
              {pkg.best && (
                <div className="absolute top-2 right-2 chip border-war-gold/40 bg-war-gold/15 text-war-gold text-[9px] py-0">
                  ★ Лучшая цена
                </div>
              )}
              <div className="text-3xl mb-1">🪙</div>
              <div className="font-display text-2xl font-black text-war-gold">
                {pkg.ducats}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-war-muted mb-2 font-bold">
                дукатов · {pkg.label}
              </div>
              <div className="text-war-text font-mono text-sm mb-3">
                ${(pkg.priceCents / 100).toFixed(2)}
              </div>
              <button
                onClick={buyPackage}
                disabled
                className="w-full text-xs uppercase tracking-widest font-bold py-2 rounded bg-war-gold text-black opacity-70 cursor-not-allowed"
              >
                Купить
              </button>
              <div className="text-center text-[10px] text-war-muted mt-1.5 uppercase tracking-widest">
                Скоро доступно
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <div className="flex items-center gap-2 mb-3">
        <Coins className="w-3 h-3 text-war-cyan" />
        <span className="label text-[11px]">Потратить дукаты</span>
      </div>
      <p className="text-war-muted text-sm mb-4">Усили свою армию.</p>
      {CATEGORIES.map((cat) => {
        const items = SHOP_ITEMS.filter((i) => i.category === cat.key);
        if (items.length === 0) return null;
        return (
          <section key={cat.key} className="mb-8">
            <div className="label mb-3 text-[11px]">{cat.label}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item) => {
                const Icon = ICONS[item.icon] ?? Square;
                const isOwned = owns(item.key) || (item.key === "skin_classic");
                const isEquipped = item.category === "skin" && activeSkin === item.key;
                const owned = qty(item.key);
                const canAfford = (balance ?? 0) >= item.price;
                const fb = feedback?.key === item.key ? feedback : null;

                return (
                  <div
                    key={item.key}
                    className={`panel p-4 transition-all ${
                      isEquipped
                        ? "neon-frame-gold"
                        : "hover:border-war-gold/40"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-12 h-12 rounded flex items-center justify-center shrink-0 border ${
                          isEquipped
                            ? "bg-war-gold/15 border-war-gold/50 text-war-gold"
                            : "bg-war-surface/40 border-war-border text-war-muted"
                        }`}
                      >
                        {item.preview ? (
                          <SkinSwatch
                            light={item.preview.light}
                            dark={item.preview.dark}
                          />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-bold text-war-text">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-war-muted leading-snug mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-war-gold font-mono font-bold">
                        {item.price === 0 ? "Бесплатно" : `${item.price} Δ`}
                      </div>
                      {item.consumable && owned > 0 && (
                        <span className="chip border-emerald-600/40 text-emerald-300 bg-emerald-950/40">
                          ×{owned}
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      {item.category === "skin" ? (
                        isEquipped ? (
                          <button
                            disabled
                            className="w-full text-xs uppercase tracking-widest font-bold py-2 rounded border border-war-gold/40 text-war-gold bg-war-gold/10"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                            Активен
                          </button>
                        ) : isOwned ? (
                          <button
                            onClick={() => equip(item)}
                            disabled={busy === item.key}
                            className="w-full text-xs uppercase tracking-widest font-bold py-2 rounded border border-war-cyan/50 text-war-cyan hover:bg-war-cyan/10 transition-colors"
                          >
                            {busy === item.key ? (
                              <Loader2 className="w-3.5 h-3.5 inline animate-spin" />
                            ) : (
                              "Активировать"
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => buy(item)}
                            disabled={busy === item.key || !canAfford}
                            className="w-full text-xs uppercase tracking-widest font-bold py-2 rounded bg-war-gold text-black hover:bg-war-goldDark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {busy === item.key ? (
                              <Loader2 className="w-3.5 h-3.5 inline animate-spin" />
                            ) : !canAfford ? (
                              <span className="flex items-center justify-center gap-1">
                                <Lock className="w-3 h-3" /> Недостаточно
                              </span>
                            ) : (
                              "Купить"
                            )}
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => buy(item)}
                          disabled={busy === item.key || !canAfford}
                          className="w-full text-xs uppercase tracking-widest font-bold py-2 rounded bg-war-gold text-black hover:bg-war-goldDark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {busy === item.key ? (
                            <Loader2 className="w-3.5 h-3.5 inline animate-spin" />
                          ) : !canAfford ? (
                            <span className="flex items-center justify-center gap-1">
                              <Lock className="w-3 h-3" /> Недостаточно
                            </span>
                          ) : (
                            `Купить · ${item.price} Δ`
                          )}
                        </button>
                      )}
                      {fb && (
                        <div
                          className={`mt-2 text-[11px] flex items-center gap-1 ${
                            fb.ok ? "text-emerald-400" : "text-war-red"
                          }`}
                        >
                          {fb.ok ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {fb.text}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* How to earn */}
      <div className="panel p-5 mt-4">
        <PanelHeader title="Как заработать дукаты" accent="gold" />
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Earn icon="🎯" label="Победа над AI" amount="+25 Δ" />
          <Earn icon="🎖" label="Точность > 80% (дополнительно)" amount="+15 Δ" />
          <Earn icon="🤝" label="Ничья с AI" amount="+5 Δ" />
          <Earn icon="📅" label="Ежедневный вход" amount="+25 Δ" />
          <Earn icon="🏆" label="Победа в матче с дуэлью" amount="2× дуэль" />
        </div>
        <div className="px-4 pb-4">
          <Link href="/play" className="btn-primary w-full text-sm">
            <Coins className="w-4 h-4" /> Начать зарабатывать
          </Link>
        </div>
      </div>
    </div>
  );
}

function Earn({ icon, label, amount }: { icon: string; label: string; amount: string }) {
  return (
    <div className="flex items-center justify-between border-b border-war-border/40 pb-2">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-war-muted">{label}</span>
      </div>
      <span className="text-emerald-400 font-bold font-mono">{amount}</span>
    </div>
  );
}

function SkinSwatch({ light, dark }: { light: string; dark: string }) {
  return (
    <div className="w-8 h-8 rounded grid grid-cols-2 grid-rows-2 overflow-hidden border border-war-border">
      <div style={{ background: light }} />
      <div style={{ background: dark }} />
      <div style={{ background: dark }} />
      <div style={{ background: light }} />
    </div>
  );
}

function translateBuyError(msg: string): string {
  if (msg.includes("insufficient_ducats")) return "Недостаточно дукатов";
  if (msg.includes("invalid_item_or_price")) return "Цена изменилась — обнови страницу";
  if (msg.includes("not_authenticated")) return "Сначала войди";
  return msg;
}
