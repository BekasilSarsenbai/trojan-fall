import { Swords } from "lucide-react";

interface Props {
  value: number; // 0-100
  side: "blue" | "red";
  label?: string;
  rawValue?: string; // optional small number under (e.g. "27/39")
}

export function AccuracyGauge({ value, side, label = "Force", rawValue }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 28;
  const c = 2 * Math.PI * radius;
  const offset = c - (clamped / 100) * c;
  const colorMap = {
    blue: { stroke: "#3DA8FF", text: "text-war-cyan", glow: "drop-shadow-[0_0_8px_rgba(61,168,255,0.7)]" },
    red:  { stroke: "#FF3D5A", text: "text-war-red",  glow: "drop-shadow-[0_0_8px_rgba(255,61,90,0.7)]" },
  }[side];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[72px] h-[72px]">
        <svg width="72" height="72" viewBox="0 0 72 72" className={colorMap.glow}>
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="3"
          />
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke={colorMap.stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform="rotate(-90 36 36)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${colorMap.text}`}>
          <Swords className="w-3 h-3 opacity-50 -mb-0.5" />
          <span className="font-display font-bold text-base leading-none">{clamped}%</span>
          {rawValue && (
            <span className="text-[9px] font-mono opacity-70 mt-0.5">{rawValue}</span>
          )}
        </div>
      </div>
      <div className="label text-[9px]">{label}</div>
    </div>
  );
}
