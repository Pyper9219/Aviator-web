import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { MpesaDeposit } from "@/lib/db/models/MpesaDeposit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const stkCallback = body?.Body?.stkCallback;

    if (!stkCallback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
    await connectToDatabase();

    const deposit = await MpesaDeposit.findOne({ checkoutRequestId: CheckoutRequestID });
    if (!deposit) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Deposit not found" });
    }

    if (ResultCode === 0) {
      let receiptNumber = "MPESA" + Date.now();
      let confirmedAmount = deposit.amountKSH;

      if (CallbackMetadata?.Item) {
        for (const item of CallbackMetadata.Item) {
          if (item.Name === "MpesaReceiptNumber") receiptNumber = item.Value;
          if (item.Name === "Amount") confirmedAmount = Number(item.Value);
        }
      }

      deposit.status = "COMPLETED";
      deposit.mpesaReceiptNumber = receiptNumber;
      deposit.amountKSH = confirmedAmount;
      deposit.resultDesc = ResultDesc;
      deposit.completedAt = new Date();
      await deposit.save();

      await User.findByIdAndUpdate(deposit.userId, { $inc: { balanceKSH: confirmedAmount } });
    } else {
      deposit.status = "FAILED";
      deposit.resultDesc = ResultDesc;
      await deposit.save();
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Processed" });
  } catch (err: any) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: err.message });
  }
}
