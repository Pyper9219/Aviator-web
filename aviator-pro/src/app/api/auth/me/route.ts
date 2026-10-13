import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { getJwtSecret } from "@/lib/auth";
import { getWithdrawalRates } from "@/lib/withdrawals";

export async function GET(req: NextRequest) {
  const rates = getWithdrawalRates();
  try {
    const secret = getJwtSecret();
    const token = req.cookies.get("aviator_session")?.value;
    if (!token) return NextResponse.json({ user: null, rates });

    const { payload } = await jwtVerify(token, secret);
    await connectToDatabase();
    const user = await User.findById(payload.id).select("-passwordHash");
    return NextResponse.json({ user, rates });
  } catch (e) {
    console.error("Failed to load current account", e);
    return NextResponse.json({ user: null, rates });
  }
}
