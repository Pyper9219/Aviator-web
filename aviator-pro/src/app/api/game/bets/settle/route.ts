import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { Bet } from "@/lib/db/models/Bet";
import { getCurrentGameRound } from "@/lib/game/rounds";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const round = await getCurrentGameRound();
    if (round.phase !== "CRASHED") {
      return NextResponse.json({ error: "The round has not crashed yet" }, { status: 409 });
    }
    await Bet.updateMany({ roundNumber: round.roundNumber, userId, status: "ACTIVE" }, { $set: { status: "LOST" } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to settle active bets", error);
    return NextResponse.json({ error: "Unable to settle bets" }, { status: 503 });
  }
}
