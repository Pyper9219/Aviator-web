import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { getJwtSecret } from "@/lib/auth";

async function removeObsoleteEmailIndex() {
  const indexes = await User.collection.indexes();
  const obsoleteEmailIndexes = indexes.filter(
    (index) => index.unique === true && index.key.email === 1 && Object.keys(index.key).length === 1
  );

  for (const index of obsoleteEmailIndexes) {
    if (!index.name) continue;
    try {
      await User.collection.dropIndex(index.name);
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== 27) {
        throw error;
      }
    }
  }
}

function getDuplicateField(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("keyPattern" in error)) return null;
  const keyPattern = error.keyPattern;
  if (typeof keyPattern !== "object" || keyPattern === null) return null;
  const fields = Object.keys(keyPattern);
  return fields.length === 1 ? fields[0] : null;
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

    if (await User.exists({ username })) {
      return NextResponse.json({ error: "That username is already registered" }, { status: 409 });
    }
    if (await User.exists({ phoneOrEmail })) {
      return NextResponse.json({ error: "That phone number or email is already registered" }, { status: 409 });
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
      const field = getDuplicateField(error);
      if (field === "username") {
        return NextResponse.json({ error: "That username is already registered" }, { status: 409 });
      }
      if (field === "phoneOrEmail") {
        return NextResponse.json({ error: "That phone number or email is already registered" }, { status: 409 });
      }

      console.error("Registration blocked by an unexpected unique index", error);
      return NextResponse.json(
        { error: "Account registration is temporarily unavailable. Please try again shortly." },
        { status: 503 }
      );
    }

    console.error("Registration failed", error);
    return NextResponse.json({ error: "Unable to create account" }, { status: 500 });
  }
}
