import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAuthenticatedUserId } from "@/lib/auth";
import { Bet } from "@/lib/db/models/Bet";
import { GameRound } from "@/lib/db/models/GameRound";
import { User } from "@/lib/db/models/User";
import { connectToDatabase } from "@/lib/db/mongodb";
import { getCurrentGameRound, getRoundMultiplier } from "@/lib/game/rounds";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let session: mongoose.ClientSession | undefined;
  try {
    const body = await req.json();
    if (!mongoose.isValidObjectId(body.betId)) {
      return NextResponse.json({ error: "Invalid bet" }, { status: 400 });
    }

    await connectToDatabase();
    const round = await getCurrentGameRound();
    if (round.phase !== "IN_FLIGHT") {
      return NextResponse.json({ error: "Cashout is only available while the round is in flight" }, { status: 409 });
    }
    session = await mongoose.startSession();
    let result: { payout: number; newBalance: number; multiplier: number } | undefined;
    const dbSession = session;

    await dbSession.withTransaction(async () => {
      const activeRound = await GameRound.findById("current").session(dbSession);
      if (!activeRound || activeRound.roundNumber !== round.roundNumber || activeRound.phase !== "IN_FLIGHT") {
        throw new Error("ROUND_ALREADY_SETTLED");
      }
      const multiplier = getRoundMultiplier(activeRound);
      if (multiplier >= activeRound.crashMultiplier) throw new Error("ROUND_ALREADY_SETTLED");

      const bet = await Bet.findOne({ _id: body.betId, userId, status: "ACTIVE" }).session(dbSession);
      if (!bet) throw new Error("BET_NOT_ACTIVE");
      if (bet.roundNumber !== round.roundNumber) throw new Error("ROUND_ALREADY_SETTLED");

      const payout = Math.round(bet.stakeAmount * multiplier * 100) / 100;
      const settled = await Bet.updateOne(
        { _id: bet._id, userId, status: "ACTIVE" },
        { $set: { status: "CASHED_OUT", cashedOutMultiplier: multiplier, payoutAmount: payout } },
        { session: dbSession }
      );
      if (settled.modifiedCount !== 1) throw new Error("BET_NOT_ACTIVE");

      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { balanceUSD: payout, withdrawableBalanceUSD: payout } },
        { new: true, session: dbSession }
      );
      if (!user) throw new Error("ACCOUNT_NOT_FOUND");
      result = { payout, newBalance: user.balanceUSD, multiplier };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "BET_NOT_ACTIVE") {
      return NextResponse.json({ error: "Bet is not active or does not belong to this account" }, { status: 409 });
    }
    if (error instanceof Error && error.message === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "ROUND_ALREADY_SETTLED") {
      return NextResponse.json({ error: "This bet belongs to a completed round" }, { status: 409 });
    }
    console.error("Failed to cash out bet", error);
    return NextResponse.json({ error: "Unable to cash out bet" }, { status: 503 });
  } finally {
    await session?.endSession();
  }
}
