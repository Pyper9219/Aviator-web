import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAuthenticatedUserId } from "@/lib/auth";
import { Withdrawal } from "@/lib/db/models/Withdrawal";
import { User } from "@/lib/db/models/User";
import { connectToDatabase } from "@/lib/db/mongodb";
import {
  getWithdrawalRates,
  isWithdrawalCurrency,
  isWithdrawalMethod,
  WithdrawalError
} from "@/lib/withdrawals";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    await connectToDatabase();
    const [user, withdrawals] = await Promise.all([
      User.findById(userId).select("withdrawableBalanceUSD lockedBalanceUSD").lean(),
      Withdrawal.find({ userId }).sort({ createdAt: -1 }).limit(50).lean()
    ]);

    if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    return NextResponse.json({
      withdrawableBalanceUSD: user.withdrawableBalanceUSD ?? 0,
      lockedBalanceUSD: user.lockedBalanceUSD ?? 0,
      rates: getWithdrawalRates(),
      withdrawals
    });
  } catch (error) {
    console.error("Failed to load withdrawals", error);
    return NextResponse.json({ error: "Unable to load withdrawal history" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let session: mongoose.ClientSession | undefined;
  try {
    const body = await req.json();
    const amount = Number(body.amountUSD);
    const amountUSD = Math.round(amount * 100) / 100;
    const method = body.method;
    const currency = body.currency;
    const recipientName = typeof body.recipientName === "string" ? body.recipientName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const bankName = typeof body.bankName === "string" ? body.bankName.trim() : "";
    const accountNumber = typeof body.accountNumber === "string" ? body.accountNumber.trim() : "";

    if (!Number.isFinite(amountUSD) || amountUSD < 0.01) {
      return NextResponse.json({ error: "Enter a withdrawal amount of at least $0.01" }, { status: 400 });
    }
    if (!isWithdrawalMethod(method) || !isWithdrawalCurrency(currency)) {
      return NextResponse.json({ error: "Choose a supported payout method and currency" }, { status: 400 });
    }
    if (recipientName.length < 2 || recipientName.length > 100) {
      return NextResponse.json({ error: "Enter the recipient's full name" }, { status: 400 });
    }
    if (method !== "BANK_WIRE" && !/^\+?[0-9][0-9 ()-]{5,19}$/.test(phone)) {
      return NextResponse.json({ error: "Enter a valid mobile-money phone number" }, { status: 400 });
    }
    if (method === "BANK_WIRE" && (!bankName || bankName.length > 100 || accountNumber.length < 4 || accountNumber.length > 50)) {
      return NextResponse.json({ error: "Enter a bank name and valid account number" }, { status: 400 });
    }

    const exchangeRate = getWithdrawalRates()[currency];
    if (!exchangeRate) {
      return NextResponse.json({ error: `${currency} withdrawal conversion is not configured` }, { status: 503 });
    }

    await connectToDatabase();
    session = await mongoose.startSession();
    let createdWithdrawal: unknown;
    const dbSession = session;

    await dbSession.withTransaction(async () => {
      const user = await User.findOneAndUpdate(
        { _id: userId, balanceUSD: { $gte: amountUSD }, withdrawableBalanceUSD: { $gte: amountUSD } },
        { $inc: { balanceUSD: -amountUSD, withdrawableBalanceUSD: -amountUSD, lockedBalanceUSD: amountUSD } },
        { new: true, session: dbSession }
      );

      if (!user) {
        const exists = await User.exists({ _id: userId }).session(dbSession);
        throw new WithdrawalError(exists ? "Insufficient available balance" : "Account not found", exists ? 400 : 404);
      }

      const [withdrawal] = await Withdrawal.create([{
        userId,
        username: user.username,
        contact: user.phoneOrEmail,
        amountUSD,
        currency,
        exchangeRate,
        amountLocal: Math.round(amountUSD * exchangeRate),
        method,
        recipientName,
        ...(method === "BANK_WIRE" ? { bankName, accountNumber } : { phone }),
        status: "PENDING"
      }], { session: dbSession });

      createdWithdrawal = withdrawal.toObject();
    });

    return NextResponse.json({ success: true, withdrawal: createdWithdrawal }, { status: 201 });
  } catch (error) {
    if (error instanceof WithdrawalError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to request withdrawal", error);
    return NextResponse.json({ error: "Unable to create withdrawal request" }, { status: 503 });
  } finally {
    await session?.endSession();
  }
}
