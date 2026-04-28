"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Swords,
  Coins,
  User,
  LogIn,
  LogOut,
  ChevronDown,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfileStore } from "@/stores/profileStore";
import { useWallet } from "@/hooks/useWallet";

const NAV = [
  { href: "/play", label: "Битва", icon: Swords },
  { href: "/match/new", label: "Дуэль", icon: Coins },
  { href: "/shop", label: "Магазин", icon: ShoppingBag },
  { href: "/profile", label: "Профиль", icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const username = useProfileStore((s) => s.username);
  const { balance } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const isAuthRoute = pathname?.startsWith("/auth/");

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-war-bg/80 border-b border-war-border">
      <div className="max-w-[1480px] mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-war-gold to-war-goldDark rounded clip-panel" />
            <span className="relative font-black text-xl text-black">♚</span>
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-display font-black tracking-[0.2em] text-war-text group-hover:text-war-gold transition-colors text-[15px]">
              TROJAN
            </span>
            <span className="font-display font-black tracking-[0.32em] text-war-gold text-[10px] mt-0.5">
              FALL
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.href || pathname?.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`
                  flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm
                  transition-all
                  ${active
                    ? "bg-war-gold/15 text-war-gold border border-war-gold/30"
                    : "text-war-muted hover:text-war-text hover:bg-war-surface"}
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{n.label}</span>
              </Link>
            );
          })}

          {/* Auth */}
          {!user && !isAuthRoute && (
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm border border-war-gold/40 text-war-gold hover:bg-war-gold/10 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Войти</span>
            </Link>
          )}

          {user && balance !== null && (
            <Link
              href="/profile"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm border border-war-gold/30 bg-war-gold/5 text-war-gold hover:bg-war-gold/15 transition-colors font-mono font-bold"
              title="Дукаты"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{balance}</span>
              <span className="hidden sm:inline text-[10px] text-war-gold/70">Δ</span>
            </Link>
          )}

          {user && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm border border-war-border hover:border-war-gold/50 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-war-gold/15 border border-war-gold/40 text-war-gold flex items-center justify-center text-[11px] font-bold">
                  {(username || user.email || "?").slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden sm:inline text-war-text max-w-[120px] truncate">
                  {username || user.email}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-war-muted" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 panel p-1 shadow-2xl">
                  <div className="px-3 py-2 border-b border-war-border">
                    <div className="text-xs text-war-muted">Вошёл как</div>
                    <div className="text-sm text-war-text truncate">
                      {user.email}
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-war-text hover:bg-war-surface rounded transition-colors"
                  >
                    <User className="w-4 h-4 text-war-muted" />
                    Профиль
                  </Link>
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-war-red hover:bg-red-950/40 rounded transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
