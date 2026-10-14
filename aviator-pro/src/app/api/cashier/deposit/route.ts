import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Transaction } from "@/lib/db/models/Transaction";
import {
  getDepositKESPerUsd,
  getSafeMpesaErrorMessage,
  initiateStkPush,
  normalizeKenyanPhoneNumber,
} from "@/lib/mpesa";
import { verifyAndSettleStkDeposit } from "@/lib/mpesa-deposits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    await connectToDatabase();
    const reference = req.nextUrl.searchParams.get("reference");

    if (reference) {
      const transaction = await Transaction.findOne({ userId, reference, method: "MPESA" })
        .select("reference status amountLocal amountUSD currency createdAt resultDescription mpesaReceiptNumber checkoutRequestId callbackResultCode")
        .lean();
      if (!transaction) {
        return NextResponse.json({ error: "Deposit request not found" }, { status: 404 });
      }

      if (transaction.status === "pending" && transaction.checkoutRequestId && transaction.callbackResultCode !== undefined) {
        await verifyAndSettleStkDeposit(transaction.checkoutRequestId);
        const refreshedTransaction = await Transaction.findOne({ userId, reference, method: "MPESA" })
          .select("reference status amountLocal amountUSD currency createdAt resultDescription mpesaReceiptNumber")
          .lean();
        return NextResponse.json({ transaction: refreshedTransaction });
      }

      return NextResponse.json({ transaction });
    }

    const transactions = await Transaction.find({ userId, method: "MPESA" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("reference status amountLocal amountUSD currency createdAt resultDescription mpesaReceiptNumber")
      .lean();
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Failed to load M-Pesa deposits", error);
    return NextResponse.json({ error: "Unable to load deposit history" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const body = await req.json();
    const amountKES = Number(body.amountKES);
    const phone = normalizeKenyanPhoneNumber(body.phone);
    const kesPerUsd = getDepositKESPerUsd();

    if (!Number.isSafeInteger(amountKES) || amountKES < 1 || amountKES > 250_000) {
      return NextResponse.json({ error: "Enter a whole KSh amount between 1 and 250,000" }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Enter a valid Kenyan M-Pesa phone number" }, { status: 400 });
    }
    if (!kesPerUsd) {
      return NextResponse.json(
        { error: "KES-to-USD conversion is not configured. Set DEPOSIT_KES_PER_USD or WITHDRAWAL_KES_PER_USD." },
        { status: 503 }
      );
    }

    const amountUSD = Math.round((amountKES / kesPerUsd) * 100) / 100;
    if (!Number.isFinite(amountUSD) || amountUSD < 0.01) {
      return NextResponse.json({ error: "Deposit amount is too small to credit to the account" }, { status: 400 });
    }

    await connectToDatabase();
    const existingPendingDeposit = await Transaction.findOne({
      userId,
      method: "MPESA",
      status: "pending",
    }).select("reference");
    if (existingPendingDeposit) {
      return NextResponse.json(
        { error: "A M-Pesa deposit is already pending. Approve its prompt or check its status before starting another." },
        { status: 409 }
      );
    }

    const reference = randomUUID();
    const transaction = await Transaction.create({
      userId,
      reference,
      method: "MPESA",
      phone,
      amountLocal: amountKES,
      amountUSD,
      currency: "KES",
      status: "pending",
    });

    try {
      const stkResponse = await initiateStkPush({
        amountKES,
        phoneNumber: phone,
        accountReference: `AC${String(userId).slice(-8)}`.slice(0, 12),
      });

      await Transaction.updateOne(
        { _id: transaction._id, status: "pending" },
        {
          $set: {
            checkoutRequestId: stkResponse.CheckoutRequestID,
            merchantRequestId: stkResponse.MerchantRequestID,
            resultDescription: stkResponse.CustomerMessage,
          },
        }
      );

      return NextResponse.json({
        success: true,
        reference,
        status: "pending",
        message: stkResponse.CustomerMessage || "Check your phone and approve the M-Pesa prompt.",
      }, { status: 202 });
    } catch (error) {
      const safeErrorMessage = getSafeMpesaErrorMessage(error);
      await Transaction.updateOne(
        { _id: transaction._id, status: "pending", checkoutRequestId: { $exists: false } },
        {
          $set: {
            status: "failed",
            resultDescription: safeErrorMessage,
          },
        }
      );
      console.error("Failed to initiate M-Pesa STK Push", safeErrorMessage);
      return NextResponse.json(
        { error: `Unable to start the M-Pesa payment: ${safeErrorMessage}` },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Failed to create M-Pesa deposit", error);
    return NextResponse.json({ error: "Unable to create M-Pesa deposit request" }, { status: 503 });
  }
}
