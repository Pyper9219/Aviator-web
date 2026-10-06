import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { getJwtSecret } from "@/lib/auth";

async function removeObsoleteEmailIndex() {
  const indexes = await User.collection.indexes();
  const emailIndex = indexes.find(
    (index) => index.name === "email_1" && index.key.email === 1 && Object.keys(index.key).length === 1
  );

  if (!emailIndex?.name) return;

  try {
    await User.collection.dropIndex(emailIndex.name);
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== 27) {
      throw error;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = getJwtSecret();
    const body = await req.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const phoneOrEmail = typeof body.phoneOrEmail === "string" ? body.phoneOrEmail.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !phoneOrEmail || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await connectToDatabase();
    await removeObsoleteEmailIndex();

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
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return NextResponse.json(
        { error: "Username or phone/email is already registered" },
        { status: 409 }
      );
    }

    console.error("Registration failed", error);
    return NextResponse.json({ error: "Unable to create account" }, { status: 500 });
  }
}
