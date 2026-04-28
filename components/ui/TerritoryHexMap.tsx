import { Crown } from "lucide-react";

interface Props {
  white: number; // %
  black: number; // %
}

// Visual hex grid representation of territory control.
// Generates 5x4 honeycomb where each hex is colored by ratio.
export function TerritoryHexMap({ white, black }: Props) {
  const total = white + black + 1;
  const whiteRatio = white / total;
  const HEX_COUNT = 18;
  const whiteCount = Math.round(HEX_COUNT * whiteRatio);
  const blackCount = HEX_COUNT - whiteCount;

  const hexes: ("blue" | "red")[] = [
    ...Array(whiteCount).fill("blue"),
    ...Array(blackCount).fill("red"),
  ];

  return (
    <div className="grid grid-cols-2 items-center gap-3">
      <div className="relative aspect-[1.1] flex items-center justify-center">
        <Honeycomb hexes={hexes.slice(0, 9)} side="blue" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <Crown className="w-5 h-5 text-war-cyan drop-shadow-[0_0_6px_rgba(61,168,255,0.9)]" />
        </div>
      </div>
      <div className="relative aspect-[1.1] flex items-center justify-center">
        <Honeycomb hexes={hexes.slice(0, 9).map(() => "red")} side="red" overrideCount={blackCount > 9 ? 9 : Math.max(1, blackCount)} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <Crown className="w-5 h-5 text-war-red drop-shadow-[0_0_6px_rgba(255,61,90,0.9)]" />
        </div>
      </div>
    </div>
  );
}

function Honeycomb({
  hexes,
  side,
  overrideCount,
}: {
  hexes: ("blue" | "red")[];
  side: "blue" | "red";
  overrideCount?: number;
}) {
  const filledCount = overrideCount ?? hexes.filter((h) => h === side).length;
  const total = 9;
  const fillSet = new Set<number>();
  // pre-pick which hexes to fill (3, then 6, etc.)
  const order = [4, 1, 7, 3, 5, 0, 8, 2, 6];
  for (let i = 0; i < filledCount && i < total; i++) fillSet.add(order[i]);

  const sideMap = {
    blue: { fill: "fill-war-cyan/80", stroke: "stroke-war-cyan", glow: "drop-shadow-[0_0_4px_rgba(61,168,255,0.8)]" },
    red: { fill: "fill-war-red/80", stroke: "stroke-war-red", glow: "drop-shadow-[0_0_4px_rgba(255,61,90,0.8)]" },
  }[side];

  return (
    <svg viewBox="0 0 90 90" className="w-full">
      {Array.from({ length: total }).map((_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = 18 + col * 27 + (row % 2 === 1 ? 13.5 : 0);
        const cy = 18 + row * 23;
        const filled = fillSet.has(i);
        return (
          <polygon
            key={i}
            points={hexPoints(cx, cy, 12)}
            className={`${filled ? sideMap.fill : "fill-transparent"} ${sideMap.stroke} ${filled ? sideMap.glow : ""}`}
            strokeWidth={1}
            opacity={filled ? 1 : 0.45}
          />
        );
      })}
    </svg>
  );
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}
