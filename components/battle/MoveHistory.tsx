"use client";
import { useEffect, useRef } from "react";

interface Props {
  history: string[];
}

export function MoveHistory({ history }: Props) {
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
      <div className="p-3 text-xs text-war-dim text-center">
        Партия ещё не началась
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="text-xs font-mono max-h-[260px] overflow-y-auto scrollbar-thin"
    >
      <table className="w-full">
        <tbody>
          {pairs.map((p, i) => {
            const isLast = i === pairs.length - 1;
            return (
              <tr
                key={p.no}
                className={`${isLast ? "bg-war-gold/5" : ""} hover:bg-war-surface/50`}
              >
                <td className="text-war-dim py-1 pl-3 pr-2 w-8">{p.no}.</td>
                <td className={`py-1 ${isLast && p.black === undefined ? "text-war-gold font-bold" : "text-war-text"}`}>
                  {p.white}
                </td>
                <td className={`py-1 pr-3 ${isLast && p.black ? "text-war-gold font-bold" : "text-war-muted"}`}>
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
