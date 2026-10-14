import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Withdrawal } from "@/lib/db/models/Withdrawal";
import { User } from "@/lib/db/models/User";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "super-secret-jwt-key-aviator-production-flight-deck-token-12345");

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("aviator_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, SECRET);
    if (payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only administrators can authorize withdrawals." }, { status: 403 });
    }

    const { withdrawalId, action, adminNote } = await req.json();
    if (!withdrawalId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action parameters" }, { status: 400 });
    }

    await connectToDatabase();
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal record not found" }, { status: 404 });
    }
    if (withdrawal.status !== "PENDING") {
      return NextResponse.json({ error: `Withdrawal has already been marked ${withdrawal.status}` }, { status: 400 });
    }

    if (action === "APPROVE") {
      await User.findByIdAndUpdate(withdrawal.userId, { $inc: { lockedWithdrawalKSH: -withdrawal.amountKSH } });
      withdrawal.status = "APPROVED";
      withdrawal.approvedAt = new Date();
      withdrawal.adminNote = adminNote || `Authorized by Admin (${payload.username || "SuperAdmin"})`;
      await withdrawal.save();
      return NextResponse.json({ success: true, message: `Payout of KSh ${withdrawal.amountKSH.toLocaleString()} successfully authorized and dispatched.` });
    } else {
      await User.findByIdAndUpdate(withdrawal.userId, { $inc: { lockedWithdrawalKSH: -withdrawal.amountKSH, balanceKSH: withdrawal.amountKSH } });
      withdrawal.status = "REJECTED";
      withdrawal.rejectedAt = new Date();
      withdrawal.adminNote = adminNote || "Withdrawal rejected by administrator. Funds refunded to wallet.";
      await withdrawal.save();
      return NextResponse.json({ success: true, message: "Withdrawal rejected. Funds automatically refunded to player wallet balance." });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process withdrawal action" }, { status: 500 });
  }
}
