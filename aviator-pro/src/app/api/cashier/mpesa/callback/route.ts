import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Transaction } from "@/lib/db/models/Transaction";
import { normalizeKenyanPhoneNumber } from "@/lib/mpesa";
import { verifyAndSettleStkDeposit } from "@/lib/mpesa-deposits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StkCallbackItem {
  Name?: string;
  Value?: string | number;
}

function getCallbackValue(items: StkCallbackItem[], name: string): string | number | undefined {
  return items.find((item) => item.Name === name)?.Value;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;
    const checkoutRequestId = callback?.CheckoutRequestID;
    const rawResultCode = callback?.ResultCode;
    const resultCode =
      typeof rawResultCode === "number"
        ? rawResultCode
        : typeof rawResultCode === "string" && rawResultCode.trim() !== ""
          ? Number(rawResultCode)
          : Number.NaN;

    if (
      typeof checkoutRequestId !== "string" ||
      !checkoutRequestId ||
      !Number.isInteger(resultCode)
    ) {
      return NextResponse.json({ error: "Invalid M-Pesa callback" }, { status: 400 });
    }

    await connectToDatabase();
    const transaction = await Transaction.findOne({
      checkoutRequestId,
      method: "MPESA",
    });
    if (!transaction) {
      console.warn("Received M-Pesa callback for an unknown checkout request");
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Callback accepted" });
    }
    if (transaction.status !== "pending") {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Callback already processed" });
    }

    const metadata = Array.isArray(callback.CallbackMetadata?.Item)
      ? (callback.CallbackMetadata.Item as StkCallbackItem[])
      : [];
    const rawAmount = getCallbackValue(metadata, "Amount");
    const parsedAmount = typeof rawAmount === "number" ? rawAmount : Number(rawAmount);
    const callbackAmount = Number.isFinite(parsedAmount) ? parsedAmount : -1;
    const callbackPhone = normalizeKenyanPhoneNumber(
      String(getCallbackValue(metadata, "PhoneNumber") ?? "")
    );
    const receiptValue = getCallbackValue(metadata, "MpesaReceiptNumber");
    const mpesaReceiptNumber = typeof receiptValue === "string" ? receiptValue : "";

    const callbackFields = {
      callbackResultCode: resultCode,
      resultDescription:
        typeof callback.ResultDesc === "string"
          ? callback.ResultDesc.slice(0, 500)
          : "M-Pesa returned a payment result",
      ...(resultCode === 0
        ? {
            callbackAmount,
            callbackPhone: callbackPhone ?? "",
            mpesaReceiptNumber,
          }
        : {}),
    };
    await Transaction.updateOne(
      {
        _id: transaction._id,
        status: "pending",
        callbackResultCode: { $exists: false },
      },
      { $set: callbackFields }
    );

    await verifyAndSettleStkDeposit(checkoutRequestId);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Callback accepted" });
  } catch (error) {
    console.error("Failed to process M-Pesa callback", error);
    return NextResponse.json({ error: "Unable to process payment callback" }, { status: 503 });
  }
}
