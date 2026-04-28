import { Crown } from "lucide-react";

interface Props {
  value: number; // 0-100
  side: "blue" | "red";
}

export function StabilityBar({ value, side }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const segments = 8;
  const filled = Math.round((clamped / 100) * segments);
  const colorMap = {
    blue: {
      fill: "bg-war-cyan",
      glow: "shadow-[0_0_8px_rgba(61,168,255,0.7)]",
      text: "text-war-cyan",
      icon: "text-war-cyan",
    },
    red: {
      fill: "bg-war-red",
      glow: "shadow-[0_0_8px_rgba(255,61,90,0.7)]",
      text: "text-war-red",
      icon: "text-war-red",
    },
  }[side];

  return (
    <div className="flex items-center gap-2">
      <Crown className={`w-3.5 h-3.5 ${colorMap.icon}`} />
      <div className="flex-1 flex gap-[2px]">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-sm border ${
              i < filled
                ? `${colorMap.fill} ${colorMap.glow} border-transparent`
                : "bg-war-surface/40 border-war-border"
            }`}
          />
        ))}
      </div>
      <span className={`text-[11px] font-mono font-bold ${colorMap.text} w-10 text-right`}>
        {clamped}%
      </span>
    </div>
  );
}
