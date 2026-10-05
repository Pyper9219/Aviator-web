import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Transaction } from "@/lib/db/models/Transaction";
import { User } from "@/lib/db/models/User";

export async function POST(req: NextRequest) {
  try {
    const { method, phone, amountUSD, currency = "KES" } = await req.json();

    if (!amountUSD || amountUSD <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const rate = currency === "KES" ? 135 : 1450;
    const localAmount = Math.round(amountUSD * rate);
    const reference = `${method}_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;

    await connectToDatabase();

    // In production, integrate Safaricom Daraja STK Push or Airtel Money OpenAPI
    // Here we generate an instant STK prompt confirmation
    let user = await User.findOne();
    if (user) {
      user.balanceUSD += amountUSD;
      await user.save();

      await Transaction.create({
        userId: user._id.toString(),
        reference,
        method,
        phone: phone || "254712345678",
        amountLocal: localAmount,
        amountUSD,
        currency,
        status: "completed"
      });
    }

    return NextResponse.json({
      success: true,
      reference,
      method,
      amountUSD,
      localAmount,
      message: `Prompt sent to ${phone || "mobile phone"}. Deposit of $${amountUSD} (${currency} ${localAmount}) credited to your cockpit balance.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
