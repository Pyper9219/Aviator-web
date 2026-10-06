import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAuthenticatedUserId } from "@/lib/auth";
import { Bet } from "@/lib/db/models/Bet";
import { User } from "@/lib/db/models/User";
import { connectToDatabase } from "@/lib/db/mongodb";
import { getCurrentGameRound } from "@/lib/game/rounds";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let session: mongoose.ClientSession | undefined;
  try {
    const body = await req.json();
    const amount = Number(body.stakeAmount);
    const stakeAmount = Math.round(amount * 100) / 100;
    const consoleSlot = Number(body.consoleSlot);
    if (!Number.isFinite(stakeAmount) || stakeAmount < 0.01 || ![1, 2].includes(consoleSlot)) {
      return NextResponse.json({ error: "Invalid stake or console" }, { status: 400 });
    }

    await connectToDatabase();
    const round = await getCurrentGameRound();
    if (round.phase !== "PREPARING") {
      return NextResponse.json({ error: "Bets are accepted only during the pre-flight countdown" }, { status: 409 });
    }
    session = await mongoose.startSession();
    let createdBet: unknown;
    let newBalance = 0;
    const dbSession = session;

    await dbSession.withTransaction(async () => {
      const user = await User.findOneAndUpdate(
        {
          _id: userId,
          balanceUSD: { $gte: stakeAmount },
          withdrawableBalanceUSD: { $gte: stakeAmount }
        },
        { $inc: { balanceUSD: -stakeAmount, withdrawableBalanceUSD: -stakeAmount } },
        { new: true, session: dbSession }
      );
      if (!user) {
        const exists = await User.exists({ _id: userId }).session(dbSession);
        throw new Error(exists ? "INSUFFICIENT_BALANCE" : "ACCOUNT_NOT_FOUND");
      }

      const [bet] = await Bet.create([{
        roundNumber: round.roundNumber,
        userId,
        username: user.username,
        consoleSlot,
        stakeAmount,
        status: "ACTIVE"
      }], { session: dbSession });
      createdBet = bet.toObject();
      newBalance = user.balanceUSD;
    });

    return NextResponse.json({ success: true, bet: createdBet, newBalance }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "A bet is already placed in this console for this round" }, { status: 409 });
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "Insufficient available balance" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    console.error("Failed to place bet", error);
    return NextResponse.json({ error: "Unable to place bet" }, { status: 503 });
  } finally {
    await session?.endSession();
  }
}
