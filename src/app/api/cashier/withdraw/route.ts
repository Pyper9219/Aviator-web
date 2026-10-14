import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Withdrawal } from "@/lib/db/models/Withdrawal";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "super-secret-jwt-key-aviator-production-flight-deck-token-12345");

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("aviator_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, SECRET);
    const userId = payload.id as string;
    const { method, accountNumber, accountName, amountKSH } = await req.json();
    const withdrawAmount = parseFloat(amountKSH);

    if (!withdrawAmount || withdrawAmount < 200) {
      return NextResponse.json({ error: "Minimum withdrawal amount is KSh 200" }, { status: 400 });
    }

    await connectToDatabase();

    // STRICT LOCK: Deduct from available balance, hold in lockedWithdrawalKSH
    const user = await User.findOneAndUpdate(
      { _id: userId, balanceKSH: { $gte: withdrawAmount } },
      { $inc: { balanceKSH: -withdrawAmount, lockedWithdrawalKSH: withdrawAmount } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "Insufficient available KSh wallet balance" }, { status: 400 });
    }

    // Create withdrawal request with PENDING status (Requires Admin Approval)
    const withdrawal = await Withdrawal.create({
      userId: user._id.toString(),
      username: user.username,
      method,
      accountNumber,
      accountName: accountName || user.username,
      amountKSH: withdrawAmount,
      status: "PENDING"
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted. Awaiting Admin Clearance ⏳",
      newBalance: user.balanceKSH
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Withdrawal failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("aviator_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { payload } = await jwtVerify(token, SECRET);
    await connectToDatabase();
    const history = await Withdrawal.find({ userId: payload.id as string }).sort({ createdAt: -1 }).limit(20);
    return NextResponse.json({ history });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
