import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { Bet } from "@/lib/db/models/Bet";
import { connectToDatabase } from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  if (!await getAuthenticatedUserId(req)) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const [bets, activeCount] = await Promise.all([
      Bet.find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .select("username stakeAmount status cashedOutMultiplier payoutAmount createdAt")
        .lean(),
      Bet.countDocuments({ status: "ACTIVE" })
    ]);
    return NextResponse.json({ bets, activeCount });
  } catch (error) {
    console.error("Failed to load live bets", error);
    return NextResponse.json({ error: "Unable to load live bets" }, { status: 503 });
  }
}
