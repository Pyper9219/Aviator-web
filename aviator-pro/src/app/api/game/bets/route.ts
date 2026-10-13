import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAuthenticatedUserId } from "@/lib/auth";
import { Bet } from "@/lib/db/models/Bet";
import { connectToDatabase } from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  if (!await getAuthenticatedUserId(req)) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const afterCreatedAtParam = req.nextUrl.searchParams.get("afterCreatedAt");
    const afterId = req.nextUrl.searchParams.get("afterId");
    if (Boolean(afterCreatedAtParam) !== Boolean(afterId)) {
      return NextResponse.json({ error: "Both feed cursor values are required" }, { status: 400 });
    }

    const afterCreatedAt = afterCreatedAtParam ? new Date(afterCreatedAtParam) : null;
    if (
      (afterCreatedAt && Number.isNaN(afterCreatedAt.getTime())) ||
      (afterId && !mongoose.isValidObjectId(afterId))
    ) {
      return NextResponse.json({ error: "Invalid feed cursor" }, { status: 400 });
    }

    await connectToDatabase();
    const newBetsQuery = afterCreatedAt && afterId
      ? Bet.find({
          $or: [
            { createdAt: { $gt: afterCreatedAt } },
            { createdAt: afterCreatedAt, _id: { $gt: new mongoose.Types.ObjectId(afterId) } }
          ]
        })
          .sort({ createdAt: 1, _id: 1 })
          .limit(100)
          .select("username stakeAmount status cashedOutMultiplier payoutAmount createdAt")
          .lean()
      : Promise.resolve([]);

    const [bets, newBets, activeCount] = await Promise.all([
      Bet.find({})
        .sort({ createdAt: -1, _id: -1 })
        .limit(100)
        .select("username stakeAmount status cashedOutMultiplier payoutAmount createdAt")
        .lean(),
      newBetsQuery,
      Bet.countDocuments({ status: "ACTIVE" })
    ]);
    return NextResponse.json({ bets, newBets, activeCount });
  } catch (error) {
    console.error("Failed to load live bets", error);
    return NextResponse.json({ error: "Unable to load live bets" }, { status: 503 });
  }
}
