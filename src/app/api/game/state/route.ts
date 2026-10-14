import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GameRound } from "@/lib/db/models/GameRound";
import { Bet } from "@/lib/db/models/Bet";
import { generateRoundCrash } from "@/lib/game/provablyFair";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const now = Date.now();

    let currentRound = await GameRound.findOne().sort({ roundNumber: -1 });

    if (!currentRound || (currentRound.status === "CRASHED" && now > currentRound.crashTime + 3500)) {
      const nextRoundNumber = currentRound ? currentRound.roundNumber + 1 : 100001;
      const { crashMultiplier, hash, serverSeed, clientSeed } = generateRoundCrash(nextRoundNumber);
      
      const flightDurationSeconds = Math.max(0.5, Math.log(crashMultiplier) / 0.07);
      const flightDurationMs = Math.round(flightDurationSeconds * 1000);
      const startTime = now + 4000;
      const crashTime = startTime + flightDurationMs;

      currentRound = await GameRound.create({
        roundNumber: nextRoundNumber,
        serverSeed,
        clientSeed,
        nonce: nextRoundNumber,
        sha256Hash: hash,
        crashMultiplier,
        status: "PREPARING",
        startTime,
        crashTime
      });
    }

    let phase = currentRound.status;
    let liveMultiplier = 1.00;

    if (now < currentRound.startTime) {
      phase = "PREPARING";
      liveMultiplier = 1.00;
    } else if (now >= currentRound.startTime && now < currentRound.crashTime) {
      phase = "IN_FLIGHT";
      if (currentRound.status !== "IN_FLIGHT") {
        currentRound.status = "IN_FLIGHT";
        await currentRound.save();
      }
      const elapsedSec = (now - currentRound.startTime) / 1000;
      liveMultiplier = parseFloat((1.00 * Math.pow(Math.E, 0.07 * elapsedSec)).toFixed(2));
    } else if (now >= currentRound.crashTime) {
      phase = "CRASHED";
      liveMultiplier = currentRound.crashMultiplier;
      if (currentRound.status !== "CRASHED") {
        currentRound.status = "CRASHED";
        await currentRound.save();
        await Bet.updateMany(
          { roundNumber: currentRound.roundNumber, status: "ACTIVE" },
          { $set: { status: "LOST" } }
        );
      }
    }

    const pastRounds = await GameRound.find({ status: "CRASHED" })
      .sort({ roundNumber: -1 })
      .limit(15)
      .select("crashMultiplier roundNumber");
    
    const history = pastRounds.map(r => r.crashMultiplier);

    const activeBets = await Bet.find({ roundNumber: currentRound.roundNumber })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("username stakeAmount status cashedOutMultiplier payoutAmount consoleSlot");

    return NextResponse.json({
      roundNumber: currentRound.roundNumber,
      phase,
      multiplier: liveMultiplier,
      crashMultiplier: currentRound.crashMultiplier,
      startTime: currentRound.startTime,
      serverTime: now,
      history: history.length > 0 ? history : [2.14, 1.35, 8.42, 1.05, 3.80],
      activeBets,
      sha256Hash: currentRound.sha256Hash
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
