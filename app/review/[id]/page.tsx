"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WarReport } from "@/components/review/WarReport";
import { useProfileStore } from "@/stores/profileStore";
import type { WarReport as WarReportType } from "@/lib/chess/review";
import { Loader2 } from "lucide-react";

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const getGame = useProfileStore((s) => s.getGameById);
  const [game, setGame] = useState<ReturnType<typeof getGame>>(undefined);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setGame(getGame(params.id));
  }, [params.id, getGame]);

  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({ title: "Trojan Fall — Battle Report", url })
        .catch(() => navigator.clipboard.writeText(url));
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-war-gold animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-war-muted mb-3">Партия не найдена</div>
        <button onClick={() => router.push("/play")} className="btn-primary">
          Сыграть новую партию
        </button>
      </div>
    );
  }

  const report: WarReportType = {
    accuracy: game.accuracy,
    territory: game.territory,
    headline: game.headline,
    narrative: game.narrative,
    incidents: game.incidents as WarReportType["incidents"],
    strengths: game.strengths,
    rating_delta: game.rating_delta,
    xp_earned: game.xp_earned,
    ducats_earned: game.ducats_earned,
    moveCount: game.moveCount,
    result: game.result,
    playerColor: game.playerColor,
    keyMoments: game.keyMoments as WarReportType["keyMoments"],
  };

  return (
    <WarReport
      report={report}
      onPlayAgain={() => router.push("/play")}
      onShare={share}
    />
  );
}
