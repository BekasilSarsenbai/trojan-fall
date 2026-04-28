"use client";
import { useEffect, useRef } from "react";

export function MoveHistoryTable({ history }: { history: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [history.length]);

  const pairs: Array<{ no: number; white?: string; black?: string }> = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ no: i / 2 + 1, white: history[i], black: history[i + 1] });
  }

  if (pairs.length === 0) {
    return (
      <div className="p-3 text-[11px] font-mono text-war-dim text-center">
        Партия ещё не началась
      </div>
    );
  }

  return (
    <div ref={ref} className="max-h-[280px] overflow-y-auto scrollbar-thin">
      <table className="w-full text-sm font-mono">
        <tbody>
          {pairs.map((p, i) => {
            const isLast = i === pairs.length - 1;
            return (
              <tr
                key={p.no}
                className={`${
                  isLast ? "bg-war-gold/10" : ""
                } border-b border-war-border/30 last:border-b-0`}
              >
                <td className="text-war-dim py-1.5 pl-3 pr-2 w-9 font-display text-xs">
                  {p.no}.
                </td>
                <td
                  className={`py-1.5 pr-2 ${
                    isLast && p.black === undefined
                      ? "text-war-gold font-bold"
                      : "text-war-text"
                  }`}
                >
                  {p.white}
                </td>
                <td
                  className={`py-1.5 pr-3 ${
                    isLast && p.black ? "text-war-gold font-bold" : "text-war-muted"
                  }`}
                >
                  {p.black ?? ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
