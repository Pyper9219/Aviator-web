import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "super-secret-jwt-key-aviator-production-flight-deck-token-12345");

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("aviator_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, SECRET);
    const { stakeAmount, consoleSlot } = await req.json();
    const stake = parseFloat(stakeAmount);

    if (!stake || stake <= 0) return NextResponse.json({ error: "Invalid stake" }, { status: 400 });

    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { _id: payload.id, balanceKSH: { $gte: stake } },
      { $inc: { balanceKSH: -stake } },
      { new: true }
    );

    if (!user) return NextResponse.json({ error: "Insufficient KSh balance. Please top up via M-PESA." }, { status: 400 });

    return NextResponse.json({ success: true, betId: `bet_${Date.now()}_slot${consoleSlot}`, newBalance: user.balanceKSH });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
