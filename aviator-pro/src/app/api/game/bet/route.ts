import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";

export async function POST(req: NextRequest) {
  try {
    const { stakeAmount, consoleSlot } = await req.json();
    await connectToDatabase();

    const user = await User.findOne();
    if (user) {
      if (user.balanceUSD < stakeAmount) {
        return NextResponse.json({ error: "Insufficient balance. Deposit via M-PESA, Airtel, or Card." }, { status: 400 });
      }
      user.balanceUSD -= stakeAmount;
      await user.save();
      return NextResponse.json({ success: true, betId: `bet_${Date.now()}_${consoleSlot}`, newBalance: user.balanceUSD });
    }

    return NextResponse.json({ success: true, betId: `mock_${Date.now()}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
