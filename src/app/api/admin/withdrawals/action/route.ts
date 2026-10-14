import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Withdrawal } from "@/lib/db/models/Withdrawal";
import { User } from "@/lib/db/models/User";

export async function POST(req: NextRequest) {
  try {
    const { withdrawalId, action, adminNote } = await req.json();
    if (!withdrawalId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action parameters" }, { status: 400 });
    }

    await connectToDatabase();
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
    if (withdrawal.status !== "PENDING") {
      return NextResponse.json({ error: `Withdrawal is already ${withdrawal.status}` }, { status: 400 });
    }

    if (action === "APPROVE") {
      // Approve: Permanently release the locked funds
      await User.findByIdAndUpdate(withdrawal.userId, { $inc: { lockedWithdrawalKSH: -withdrawal.amountKSH } });
      withdrawal.status = "APPROVED";
      withdrawal.approvedAt = new Date();
      withdrawal.adminNote = adminNote || "Approved and disbursed.";
      await withdrawal.save();
      return NextResponse.json({ success: true, message: "Payout approved and processed." });
    } else {
      // Reject: Immediately refund the locked funds back to the user's playable balance
      await User.findByIdAndUpdate(withdrawal.userId, { 
        $inc: { lockedWithdrawalKSH: -withdrawal.amountKSH, balanceKSH: withdrawal.amountKSH } 
      });
      withdrawal.status = "REJECTED";
      withdrawal.rejectedAt = new Date();
      withdrawal.adminNote = adminNote || "Rejected. Funds refunded to wallet.";
      await withdrawal.save();
      return NextResponse.json({ success: true, message: "Withdrawal rejected. Funds refunded to user." });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
