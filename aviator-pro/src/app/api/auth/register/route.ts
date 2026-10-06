import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { getJwtSecret } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const secret = getJwtSecret();
    const { username, phoneOrEmail, password } = await req.json();

    if (!username || !phoneOrEmail || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await User.findOne({ $or: [{ username }, { phoneOrEmail }] });
    if (existing) {
      return NextResponse.json({ error: "Username or Phone/Email already registered" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      phoneOrEmail,
      passwordHash,
      balanceUSD: 0,
      withdrawableBalanceUSD: 0,
      bonusBalanceUSD: 0,
      vipLevel: 1
    });

    const token = await new SignJWT({ id: user._id.toString(), username: user.username })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const res = NextResponse.json({ success: true, user: { username: user.username, balance: user.balanceUSD } });
    res.cookies.set("aviator_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 500 });
  }
}
