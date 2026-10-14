import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { MpesaDeposit } from "@/lib/db/models/MpesaDeposit";
import { User } from "@/lib/db/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkoutRequestId = searchParams.get("checkoutRequestId");

    if (!checkoutRequestId) {
      return NextResponse.json({ error: "checkoutRequestId required" }, { status: 400 });
    }

    await connectToDatabase();
    const deposit = await MpesaDeposit.findOne({ checkoutRequestId });
    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    let currentBalance = 0;
    if (deposit.status === "COMPLETED") {
      const user = await User.findById(deposit.userId);
      if (user) currentBalance = user.balanceKSH;
    }

    return NextResponse.json({
      status: deposit.status,
      amountKSH: deposit.amountKSH,
      receiptNumber: deposit.mpesaReceiptNumber,
      resultDesc: deposit.resultDesc,
      newBalance: currentBalance,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
