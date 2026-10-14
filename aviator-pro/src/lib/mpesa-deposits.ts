import mongoose from "mongoose";
import { Transaction } from "@/lib/db/models/Transaction";
import { User } from "@/lib/db/models/User";
import { queryStkPush } from "@/lib/mpesa";

export async function verifyAndSettleStkDeposit(checkoutRequestId: string): Promise<void> {
  const transaction = await Transaction.findOne({ checkoutRequestId });
  if (!transaction || transaction.status !== "pending") return;

  if (transaction.callbackResultCode === undefined) return;
  const query = await queryStkPush(checkoutRequestId);
  if (query.CheckoutRequestID !== checkoutRequestId) {
    throw new Error("M-Pesa STK query returned a different checkout request");
  }

  if (transaction.callbackResultCode !== 0) {
    if (String(query.ResultCode) !== String(transaction.callbackResultCode)) return;
    await Transaction.updateOne(
      { checkoutRequestId, status: "pending", callbackResultCode: transaction.callbackResultCode },
      {
        $set: {
          status: "failed",
          resultDescription: transaction.resultDescription || "M-Pesa payment was not completed",
        },
      }
    );
    return;
  }

  if (
    transaction.callbackAmount !== transaction.amountLocal ||
    transaction.callbackPhone !== transaction.phone ||
    !transaction.mpesaReceiptNumber
  ) {
    if (query.ResultCode === "0") {
      await Transaction.updateOne(
        {
          checkoutRequestId,
          status: "pending",
          callbackResultCode: 0,
        },
        {
          $set: {
            status: "failed",
            resultDescription: "M-Pesa callback details did not match the requested deposit",
          },
        }
      );
    }
    return;
  }

  if (String(query.ResultCode) !== "0") return;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const settledTransaction = await Transaction.findOneAndUpdate(
        {
          checkoutRequestId,
          status: "pending",
          callbackResultCode: 0,
          callbackAmount: transaction.amountLocal,
          callbackPhone: transaction.phone,
          mpesaReceiptNumber: transaction.mpesaReceiptNumber,
        },
        {
          $set: {
            status: "completed",
            resultDescription: "Payment verified by M-Pesa",
          },
        },
        { new: true, session }
      );

      if (!settledTransaction) return;

      const user = await User.findByIdAndUpdate(
        settledTransaction.userId,
        {
          $inc: {
            balanceUSD: settledTransaction.amountUSD,
            withdrawableBalanceUSD: settledTransaction.amountUSD,
          },
        },
        { new: true, session }
      );
      if (!user) throw new Error("Deposit account no longer exists");
    });
  } finally {
    await session.endSession();
  }
}
