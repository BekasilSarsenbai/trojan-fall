import type { WarIncident } from "@/lib/chess/review";
import {
  Swords,
  ShieldAlert,
  Users,
  Target,
  AlertTriangle,
  Crosshair,
  Skull,
} from "lucide-react";

const ICONS: Record<string, typeof Swords> = {
  sword: Swords,
  shield: ShieldAlert,
  users: Users,
  target: Target,
  alert: AlertTriangle,
  crosshair: Crosshair,
  skull: Skull,
};

const SEVERITY_CONF = {
  critical: {
    badge: "ТАКТИЧЕСКАЯ КАТАСТРОФА",
    accent: "border-l-war-red",
    chipBg: "bg-red-900/40 border-war-red/50 text-war-red",
    iconBg: "bg-red-950/60 text-war-red",
  },
  major: {
    badge: "СТРАТЕГИЧЕСКИЙ ПРОСЧЁТ",
    accent: "border-l-orange-500",
    chipBg: "bg-orange-900/30 border-orange-500/50 text-orange-300",
    iconBg: "bg-orange-950/40 text-orange-400",
  },
  minor: {
    badge: "ТАКТИЧЕСКАЯ ОШИБКА",
    accent: "border-l-yellow-500",
    chipBg: "bg-yellow-900/30 border-yellow-500/40 text-yellow-300",
    iconBg: "bg-yellow-950/40 text-yellow-400",
  },
};

export function IncidentCard({ incident }: { incident: WarIncident }) {
  const Icon = ICONS[incident.icon] ?? AlertTriangle;
  const conf = SEVERITY_CONF[incident.severity];

  return (
    <div
      className={`bg-war-panel border border-war-border rounded-xl p-4 border-l-4 ${conf.accent} animate-slide-up`}
    >
      <div className="flex items-start gap-3">
        <div className={`${conf.iconBg} p-2 rounded-lg shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`chip ${conf.chipBg}`}>{conf.badge}</span>
            {incident.move > 0 && (
              <span className="chip border-war-border text-war-muted bg-war-surface">
                Ход {incident.move}
              </span>
            )}
          </div>
          <div className="text-war-text font-semibold mb-1">{incident.title}</div>
          <div className="text-war-muted text-sm leading-relaxed mb-3">
            {incident.description}
          </div>
          <div className="bg-war-surface/60 border border-war-border rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-widest text-war-gold font-bold mb-1">
              Совет командира
            </div>
            <div className="text-war-text text-sm leading-relaxed">{incident.advice}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
