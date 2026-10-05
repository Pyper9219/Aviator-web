import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { getJwtSecret } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const secret = getJwtSecret();
    const { loginCredential, password } = await req.json();
    await connectToDatabase();

    let user = await User.findOne({
      $or: [{ username: loginCredential }, { phoneOrEmail: loginCredential }]
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials. Please create an account." }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
