import { NextRequest, NextResponse } from "next/server";
import { getMpesaAccessToken, getMpesaCredentials } from "@/lib/mpesa/daraja";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { consumerKey, consumerSecret, isProduction, baseUrl } = getMpesaCredentials();
  const keyConfigured = Boolean(consumerKey);
  const secretConfigured = Boolean(consumerSecret);
  const keyLength = consumerKey ? consumerKey.length : 0;
  const secretLength = consumerSecret ? consumerSecret.length : 0;

  try {
    const token = await getMpesaAccessToken();
    const isMock = token.startsWith("SANDBOX_MOCK_TOKEN");

    return NextResponse.json({
      status: "SUCCESS",
      connected: !isMock,
      mode: isProduction ? "Production (Live Safaricom)" : "Sandbox (Test Environment)",
      baseUrl,
      credentials: {
        consumerKeyProvided: keyConfigured,
        consumerKeyLength: keyLength,
        consumerSecretProvided: secretConfigured,
        consumerSecretLength: secretLength,
      },
      message: isMock
        ? "Warning: Running in mock development mode because no keys were found in environment variables."
        : "Successfully generated active M-PESA bearer token from Safaricom Daraja!",
      tokenPreview: `${token.substring(0, 10)}...${token.slice(-4)}`
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "FAILED",
      connected: false,
      baseUrl,
      mode: isProduction ? "Production" : "Sandbox",
      credentials: {
        consumerKeyProvided: keyConfigured,
        consumerKeyLength: keyLength,
        consumerSecretProvided: secretConfigured,
        consumerSecretLength: secretLength,
      },
      error: err.message,
      troubleshooting: [
        "Check that MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET are added under Vercel Settings -> Environment Variables.",
        "Ensure there are no leading/trailing spaces or quotation marks around the values.",
        "If using Daraja test portal credentials, set MPESA_ENVIRONMENT=sandbox.",
        "If using a live Safaricom business till/paybill, set MPESA_ENVIRONMENT=production."
      ]
    }, { status: 500 });
  }
}
