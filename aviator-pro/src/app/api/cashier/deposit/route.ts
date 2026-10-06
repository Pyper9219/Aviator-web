import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Deposits are unavailable until a verified payment provider is configured" },
    { status: 503 }
  );
}
