import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { MpesaDeposit } from "@/lib/db/models/MpesaDeposit";
import { initiateStkPush, formatKenyanPhone } from "@/lib/mpesa/daraja";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "super-secret-jwt-key-aviator-production-flight-deck-token-12345");

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("aviator_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });

    const { payload } = await jwtVerify(token, SECRET);
    const { phoneNumber, amountKSH } = await req.json();
    const amount = parseFloat(amountKSH);

    if (!amount || amount < 10) {
      return NextResponse.json({ error: "Minimum deposit is KSh 10" }, { status: 400 });
    }
    if (!phoneNumber) {
      return NextResponse.json({ error: "Safaricom phone number is required" }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(payload.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const formattedPhone = formatKenyanPhone(phoneNumber);
    
    // Call Daraja STK Push with enhanced error catching
    const stkResponse = await initiateStkPush({
      phoneNumber: formattedPhone,
      amount,
      accountReference: user.username,
      transactionDesc: "AviatorTopUp",
    });

    // Save pending deposit in database
    await MpesaDeposit.create({
      userId: user._id.toString(),
      username: user.username,
      phoneNumber: formattedPhone,
      amountKSH: amount,
      merchantRequestId: stkResponse.MerchantRequestID,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      status: "PENDING",
    });

    return NextResponse.json({
      success: true,
      message: `M-PESA prompt sent to ${formattedPhone}. Please enter your M-PESA PIN to complete deposit.`,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      customerMessage: stkResponse.CustomerMessage,
    });
  } catch (err: any) {
    console.error("STK Push error detail:", err);
    return NextResponse.json({ error: err.message || "Failed to initiate M-PESA deposit. Please check Daraja credentials." }, { status: 500 });
  }
}
