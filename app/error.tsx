"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Visible in Vercel logs
    console.error("[trojan-fall] client error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="panel p-6 max-w-lg w-full">
        <AlertTriangle className="w-10 h-10 text-war-red mb-3" />
        <h2 className="text-2xl font-black text-war-text mb-2">
          Что-то пошло не так
        </h2>
        <p className="text-war-muted text-sm mb-4">
          Клиентская ошибка. Подробности ниже — пришли мне этот текст.
        </p>

        <div className="bg-red-950/40 border border-war-red/40 rounded-lg p-3 mb-4 max-h-[200px] overflow-auto scrollbar-thin">
          <code className="text-red-200 text-xs font-mono whitespace-pre-wrap break-words block">
            {error.name}: {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
            {error.stack ? `\n\n${error.stack.split("\n").slice(0, 8).join("\n")}` : ""}
          </code>
        </div>

        <div className="flex gap-2">
          <button onClick={reset} className="btn-secondary text-sm flex-1">
            <RefreshCw className="w-4 h-4" />
            Попробовать снова
          </button>
          <Link href="/" className="btn-primary text-sm flex-1">
            <Home className="w-4 h-4" />
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
