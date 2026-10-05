import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { getJwtSecret } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const secret = getJwtSecret();
  try {
    const token = req.cookies.get("aviator_session")?.value;
    if (!token) return NextResponse.json({ user: null });

    const { payload } = await jwtVerify(token, secret);
    await connectToDatabase();
    const user = await User.findById(payload.id).select("-passwordHash");
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ user: null });
  }
}
