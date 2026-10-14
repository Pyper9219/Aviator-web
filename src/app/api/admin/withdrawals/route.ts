import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Withdrawal } from "@/lib/db/models/Withdrawal";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ withdrawals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
