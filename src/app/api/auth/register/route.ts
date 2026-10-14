import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "super-secret-jwt-key-aviator-production-flight-deck-token-12345");

export async function POST(req: NextRequest) {
  try {
    const { username, phoneOrEmail, password } = await req.json();
    if (!username || !phoneOrEmail || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await connectToDatabase();
    const existingUser = await User.findOne({ $or: [{ username }, { phoneOrEmail }] });
    if (existingUser) return NextResponse.json({ error: "User already exists" }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, phoneOrEmail, passwordHash, balanceKSH: 2500 });

    const token = await new SignJWT({ id: user._id.toString(), username: user.username })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(SECRET);

    cookies().set("aviator_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ success: true, user: { id: user._id, username: user.username, balanceKSH: user.balanceKSH } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
