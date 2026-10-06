import { NextResponse } from "next/server";
import { getCurrentGameRound, getRoundMultiplier } from "@/lib/game/rounds";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const round = await getCurrentGameRound();
    const now = new Date();
    const crashed = round.phase === "CRASHED";

    return NextResponse.json({
      roundNumber: round.roundNumber,
      phase: round.phase,
      multiplier: getRoundMultiplier(round, now),
      startsAt: round.startsAt.getTime(),
      startedAt: round.startedAt?.getTime() ?? null,
      crashAt: round.crashAt?.getTime() ?? null,
      crashMultiplier: crashed ? round.crashMultiplier : null,
      seedHash: round.seedHash,
      serverSeed: crashed ? round.serverSeed : null
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to load current game round", error);
    return NextResponse.json({ error: "Game round is temporarily unavailable" }, { status: 503 });
  }
}
