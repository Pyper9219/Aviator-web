import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";

export async function POST(req: NextRequest) {
  try {
    const { stakeAmount, multiplier } = await req.json();
    const payout = parseFloat((stakeAmount * multiplier).toFixed(2));

    await connectToDatabase();
    const user = await User.findOne();
    if (user) {
      user.balanceUSD += payout;
      await user.save();
      return NextResponse.json({ success: true, payout, newBalance: user.balanceUSD });
    }

    return NextResponse.json({ success: true, payout });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
