import { NextRequest, NextResponse } from "next/server";
import { getAdminUserIds, getAuthenticatedUserId, isAdminUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Withdrawal } from "@/lib/db/models/Withdrawal";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (getAdminUserIds().length === 0) {
    return NextResponse.json({ error: "Admin access is not configured" }, { status: 503 });
  }
  if (!isAdminUserId(userId)) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  try {
    await connectToDatabase();
    const withdrawals = await Withdrawal.find({})
      .sort({ status: 1, createdAt: -1 })
      .limit(200)
      .lean();
    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error("Failed to load admin withdrawals", error);
    return NextResponse.json({ error: "Unable to load withdrawal requests" }, { status: 503 });
  }
}
