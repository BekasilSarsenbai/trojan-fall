"use client";
import type { WarReport as WarReportType } from "@/lib/chess/review";
import { IncidentCard } from "./IncidentCard";
import { MomentsTimeline } from "./MomentsTimeline";
import { Trophy, Skull, Equal, Share2, Swords, CheckCircle2, Coins } from "lucide-react";

interface Props {
  report: WarReportType;
  onPlayAgain: () => void;
  onShare: () => void;
}

export function WarReport({ report, onPlayAgain, onShare }: Props) {
  const playerTerritory =
    report.playerColor === "white" ? report.territory.white : report.territory.black;

  const conf = {
    win: {
      bg: "bg-gradient-to-br from-emerald-950/80 via-war-panel to-war-bg",
      border: "border-emerald-600/40",
      text: "ПОБЕДА",
      color: "text-emerald-300",
      icon: Trophy,
      shadow: "shadow-[0_0_60px_rgba(16,185,129,0.25)]",
    },
    loss: {
      bg: "bg-gradient-to-br from-red-950/70 via-war-panel to-war-bg",
      border: "border-red-700/40",
      text: "ПОРАЖЕНИЕ",
      color: "text-red-300",
      icon: Skull,
      shadow: "shadow-[0_0_60px_rgba(239,68,68,0.20)]",
    },
    draw: {
      bg: "bg-gradient-to-br from-slate-800/60 via-war-panel to-war-bg",
      border: "border-slate-600/40",
      text: "НИЧЬЯ",
      color: "text-slate-300",
      icon: Equal,
      shadow: "",
    },
  }[report.result];

  const Icon = conf.icon;

  return (
    <div className="min-h-screen bg-war-bg text-war-text px-4 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Result hero */}
        <div
          className={`${conf.bg} ${conf.border} ${conf.shadow} border rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden animate-fade-in`}
        >
          <div className="absolute inset-0 war-grid opacity-20 pointer-events-none" />
          <div className="relative z-10">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${conf.color} bg-black/30 mb-3`}>
              <Icon className="w-8 h-8" />
            </div>
            <div className={`text-4xl sm:text-5xl font-black tracking-wide mb-2 ${conf.color} gold-text-glow`}>
              {conf.text}
            </div>
            <div className="text-war-muted text-sm">
              {report.moveCount} ходов · {report.playerColor === "white" ? "Белые" : "Чёрные"}
            </div>

            <div className="flex items-center justify-center gap-6 sm:gap-10 mt-6">
              <Stat label="Точность" value={`${report.accuracy}%`} accent="text-war-gold" />
              <Divider />
              <Stat
                label="Территория"
                value={`${playerTerritory}%`}
                accent="text-war-cyan"
              />
              <Divider />
              <Stat
                label="Рейтинг"
                value={`${report.rating_delta >= 0 ? "+" : ""}${report.rating_delta}`}
                accent={report.rating_delta >= 0 ? "text-emerald-400" : "text-war-red"}
              />
            </div>

            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 bg-war-gold/10 border border-war-gold/30 rounded-full px-4 py-2">
                <span className="text-war-gold font-bold text-lg">+{report.xp_earned} XP</span>
              </div>
              {(report.ducats_earned ?? 0) > 0 && (
                <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-600/40 rounded-full px-4 py-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-bold text-lg">
                    +{report.ducats_earned} Δ
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Narrative */}
        <div className="bg-war-panel border-l-4 border-war-gold rounded-r-xl p-5 sm:p-6 animate-slide-up">
          <div className="text-[10px] uppercase tracking-widest text-war-muted font-bold mb-2">
            Боевой дебрифинг
          </div>
          <div className="text-war-gold font-bold text-lg sm:text-xl mb-2">
            {report.headline}
          </div>
          <div className="text-war-text text-sm sm:text-base leading-relaxed">
            {report.narrative}
          </div>
        </div>

        {/* Key moments timeline */}
        <MomentsTimeline moments={report.keyMoments} totalMoves={report.moveCount} />

        {/* Incidents */}
        {report.incidents.length > 0 && (
          <div>
            <h3 className="text-war-muted text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Swords className="w-3 h-3" />
              Критические инциденты ({report.incidents.length})
            </h3>
            <div className="flex flex-col gap-3">
              {report.incidents.map((inc, i) => (
                <IncidentCard key={i} incident={inc} />
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {report.strengths.length > 0 && (
          <div className="bg-emerald-950/40 border border-emerald-700/30 rounded-xl p-4">
            <h3 className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" />
              Что было хорошо
            </h3>
            <ul className="space-y-1.5">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-war-text text-sm flex gap-2 items-start">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={onPlayAgain} className="btn-primary">
            <Swords className="w-4 h-4" /> Новая битва
          </button>
          <button onClick={onShare} className="btn-secondary">
            <Share2 className="w-4 h-4" /> Поделиться разбором
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="text-center">
      <div className={`text-2xl sm:text-3xl font-bold ${accent}`}>{value}</div>
      <div className="text-war-muted text-[11px] uppercase tracking-widest">{label}</div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-10 bg-war-border" />;
}
