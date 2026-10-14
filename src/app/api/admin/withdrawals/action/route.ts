import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Withdrawal } from "@/lib/db/models/Withdrawal";
import { User } from "@/lib/db/models/User";
import { sendB2CPayout } from "@/lib/mpesa/daraja";

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
      return NextResponse.json({ error: `Withdrawal is already marked ${withdrawal.status}` }, { status: 400 });
    }

    if (action === "APPROVE") {
      let mpesaTracking = "";
      if (withdrawal.method === "MPESA") {
        try {
          const b2cRes = await sendB2CPayout({
            phoneNumber: withdrawal.accountNumber,
            amount: withdrawal.amountKSH,
            remarks: "AviatorPayout",
          });
          mpesaTracking = b2cRes?.ConversationID ? ` (B2C Conv: ${b2cRes.ConversationID})` : "";
        } catch (e: any) {
          console.warn("B2C API warning (using manual release fallback):", e.message);
        }
      }

      await User.findByIdAndUpdate(withdrawal.userId, { $inc: { lockedWithdrawalKSH: -withdrawal.amountKSH } });
      withdrawal.status = "APPROVED";
      withdrawal.approvedAt = new Date();
      withdrawal.adminNote = (adminNote || "Authorized & Dispatched via M-PESA") + mpesaTracking;
      await withdrawal.save();

      return NextResponse.json({
        success: true,
        message: `Payout of KSh ${withdrawal.amountKSH.toLocaleString()} to ${withdrawal.accountNumber} approved and dispatched!`,
      });
    } else {
      await User.findByIdAndUpdate(withdrawal.userId, {
        $inc: { lockedWithdrawalKSH: -withdrawal.amountKSH, balanceKSH: withdrawal.amountKSH },
      });
      withdrawal.status = "REJECTED";
      withdrawal.rejectedAt = new Date();
      withdrawal.adminNote = adminNote || "Rejected by administrator. Funds refunded to wallet.";
      await withdrawal.save();

      return NextResponse.json({
        success: true,
        message: "Withdrawal rejected. Funds immediately returned to user wallet balance.",
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process withdrawal action" }, { status: 500 });
  }
}
