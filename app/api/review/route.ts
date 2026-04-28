import { NextResponse } from "next/server";
import { generateWarReport } from "@/lib/chess/review";

export async function POST(req: Request) {
  const body = await req.json();
  const { pgn, playerColor, result } = body as {
    pgn: string;
    playerColor: "white" | "black";
    result: "win" | "loss" | "draw";
  };
  if (!pgn || !playerColor || !result) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }
  const report = generateWarReport(pgn, playerColor, result);
  return NextResponse.json({ ok: true, report });
}
