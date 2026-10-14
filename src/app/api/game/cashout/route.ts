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
    const { payoutAmount } = await req.json();
    const payout = parseFloat(payoutAmount);

    if (!payout || payout <= 0) return NextResponse.json({ error: "Invalid payout amount" }, { status: 400 });

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      payload.id,
      { $inc: { balanceKSH: payout } },
      { new: true }
    );

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, newBalance: user.balanceKSH });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
