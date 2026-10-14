import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Withdrawal } from "@/lib/db/models/Withdrawal";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "super-secret-jwt-key-aviator-production-flight-deck-token-12345");

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("aviator_session")?.value;
    if (!token) return NextResponse.json({ count: 0, isAdmin: false }, { status: 401 });

    const { payload } = await jwtVerify(token, SECRET);
    if (payload.role !== "ADMIN") {
      return NextResponse.json({ count: 0, isAdmin: false }, { status: 403 });
    }

    await connectToDatabase();
    const count = await Withdrawal.countDocuments({ status: "PENDING" });
    return NextResponse.json({ count, isAdmin: true });
  } catch (err) {
    return NextResponse.json({ count: 0, isAdmin: false });
  }
}
