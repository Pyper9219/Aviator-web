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
    const { method, amountKSH, phoneNumber } = await req.json();
    const depositAmount = parseFloat(amountKSH);

    if (!depositAmount || depositAmount < 50) {
      return NextResponse.json({ error: "Minimum deposit amount is KSh 50" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Simulate instant deposit approval (In production, this would wait for Paystack/M-PESA webhook)
    const user = await User.findByIdAndUpdate(
      payload.id,
      { $inc: { balanceKSH: depositAmount } },
      { new: true }
    );

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deposited KSh ${depositAmount.toLocaleString()} via ${method}.`,
      newBalance: user.balanceKSH 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
