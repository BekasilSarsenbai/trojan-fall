"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  Loader2,
  Mail,
  Lock,
  AlertTriangle,
  Swords,
  Crown,
} from "lucide-react";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();

  const rawNext = searchParams.get("next") ?? "/play";
  // Only allow internal absolute paths to prevent open-redirect.
  const nextUrl =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/play";

  const otherModeHref =
    mode === "login"
      ? `/auth/signup${nextUrl !== "/play" ? `?next=${encodeURIComponent(nextUrl)}` : ""}`
      : `/auth/login${nextUrl !== "/play" ? `?next=${encodeURIComponent(nextUrl)}` : ""}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";
  const [oauthLoading, setOauthLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase не сконфигурирован. Заполни .env.local — см. .env.local.example");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(nextUrl);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { user_name: username || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("Проверь почту — мы отправили ссылку для подтверждения регистрации.");
        } else {
          router.push(nextUrl);
          router.refresh();
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(translateAuthError(message));
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    setError(null);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase не сконфигурирован.");
      return;
    }
    setOauthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
      },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-16">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-lg bg-war-gold flex items-center justify-center font-black text-black text-xl">
            ♚
          </div>
          <span className="font-black tracking-wider text-war-text text-xl">
            TROJAN <span className="text-war-gold">FALL</span>
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">
          {mode === "login" ? "Войти в штаб" : "Регистрация командира"}
        </h1>
        <p className="text-war-muted text-sm">
          {mode === "login"
            ? "Продолжи кампанию там, где остановился."
            : "Получи ID, рейтинг и место в лидерборде города."}
        </p>
      </div>

      {!configured && (
        <div className="panel p-4 mb-4 border-l-4 border-war-red flex gap-3">
          <AlertTriangle className="w-5 h-5 text-war-red shrink-0 mt-0.5" />
          <div className="text-xs text-war-muted leading-relaxed">
            <strong className="text-war-text">Auth недоступен.</strong> Добавь
            <code className="mx-1 px-1 bg-war-surface rounded text-war-gold">
              NEXT_PUBLIC_SUPABASE_URL
            </code>
            и
            <code className="mx-1 px-1 bg-war-surface rounded text-war-gold">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>
            в <code>.env.local</code>, затем перезапусти dev-сервер.
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-950/50 border border-war-red/40 text-red-200 text-sm rounded-lg px-3 py-2 mb-3 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {info && (
        <div className="bg-emerald-950/50 border border-emerald-700/40 text-emerald-200 text-sm rounded-lg px-3 py-2 mb-3">
          {info}
        </div>
      )}

      <form onSubmit={submit} className="panel p-5 sm:p-6 space-y-4">
        {mode === "signup" && (
          <Field
            label="Имя командира"
            icon={<Crown className="w-4 h-4" />}
            value={username}
            onChange={setUsername}
            placeholder="Например, Aibek_K"
            maxLength={24}
          />
        )}
        <Field
          label="Email"
          icon={<Mail className="w-4 h-4" />}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="commander@warchess.kz"
          required
          autoComplete="email"
        />
        <Field
          label="Пароль"
          icon={<Lock className="w-4 h-4" />}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={mode === "signup" ? "минимум 6 символов" : "••••••••"}
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={6}
        />

        <button
          type="submit"
          disabled={loading || !configured}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Swords className="w-4 h-4" />
          )}
          {mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>

        {googleEnabled && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-war-border" />
              <span className="text-[10px] text-war-dim uppercase tracking-widest">
                или
              </span>
              <div className="flex-1 h-px bg-war-border" />
            </div>

            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={oauthLoading || !configured}
              className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Войти через Google
            </button>
          </>
        )}
      </form>

      <div className="text-center text-sm text-war-muted mt-5">
        {mode === "login" ? (
          <>
            Ещё нет аккаунта?{" "}
            <Link href={otherModeHref} className="text-war-gold hover:underline">
              Зарегистрироваться
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{" "}
            <Link href={otherModeHref} className="text-war-gold hover:underline">
              Войти
            </Link>
          </>
        )}
      </div>

      {nextUrl !== "/play" && (
        <div className="mt-3 text-center text-[11px] text-war-dim">
          После входа: <code className="text-war-gold">{nextUrl}</code>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  icon,
  type = "text",
  value,
  onChange,
  ...rest
}: {
  label: string;
  icon: React.ReactNode;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-war-muted font-bold mb-1 block">
        {label}
      </span>
      <div className="flex items-center gap-2 bg-war-surface border border-war-border rounded-lg px-3 focus-within:border-war-gold transition-colors">
        <span className="text-war-dim">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent py-2 text-war-text placeholder-war-dim outline-none"
          {...rest}
        />
      </div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5h-1.9V20H24v8h11.3a12 12 0 1 1-3.4-13.1l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H24v8h11.3a12 12 0 0 1-4 5.5l6.2 5.3c-.4.4 6.6-4.8 6.6-15.3 0-1.2-.1-2.3-.5-3.5z"
      />
    </svg>
  );
}

function translateAuthError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Неверный email или пароль.";
  if (msg.includes("Email not confirmed")) return "Email ещё не подтверждён — проверь почту.";
  if (msg.includes("User already registered")) return "Командир с таким email уже существует.";
  if (msg.toLowerCase().includes("password")) return "Пароль не подходит — минимум 6 символов.";
  return msg;
}
