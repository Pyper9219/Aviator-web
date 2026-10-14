import { DEFAULT_KES_PER_USD } from "@/lib/withdrawals";

type MpesaEnvironment = "sandbox" | "production";

interface MpesaCredentials {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
  environment: MpesaEnvironment;
}

interface MpesaApiError {
  errorMessage?: string;
  error_description?: string;
  ResponseDescription?: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string | number;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface StkQueryResponse {
  ResponseCode?: string | number;
  ResponseDescription?: string;
  ResultCode?: string | number;
  ResultDesc?: string;
  CheckoutRequestID?: string;
}

export function getMpesaCredentials(): MpesaCredentials {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl =
    process.env.MPESA_CALLBACK_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, "")}/api/cashier/mpesa/callback`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}/api/cashier/mpesa/callback`
        : process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/api/cashier/mpesa/callback`
          : "");
  const environment = process.env.MPESA_ENVIRONMENT || "sandbox";

  if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
    throw new Error("M-Pesa credentials are not completely configured");
  }
  if (environment !== "sandbox" && environment !== "production") {
    throw new Error("MPESA_ENVIRONMENT must be sandbox or production");
  }
  if (!callbackUrl) {
    throw new Error("MPESA_CALLBACK_URL must be configured with a public HTTPS URL");
  }

  let parsedCallbackUrl: URL;
  try {
    parsedCallbackUrl = new URL(callbackUrl);
  } catch {
    throw new Error("MPESA_CALLBACK_URL must be a valid public HTTPS URL");
  }
  const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);
  if (
    parsedCallbackUrl.protocol !== "https:" ||
    parsedCallbackUrl.username ||
    parsedCallbackUrl.password ||
    localHostnames.has(parsedCallbackUrl.hostname)
  ) {
    throw new Error("MPESA_CALLBACK_URL must be a valid public HTTPS URL");
  }

  return {
    consumerKey,
    consumerSecret,
    shortcode,
    passkey,
    callbackUrl: parsedCallbackUrl.toString(),
    environment,
  };
}

function getBaseUrl(environment: MpesaEnvironment): string {
  return environment === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

async function readMpesaResponse<T>(response: Response, operation: string): Promise<T> {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`Safaricom returned an empty response during ${operation}. Please try again later.`);
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(`Safaricom returned an invalid response during ${operation}. Please try again later.`);
  }
}

async function getAccessToken(credentials: MpesaCredentials): Promise<string> {
  const authorization = Buffer.from(
    `${credentials.consumerKey}:${credentials.consumerSecret}`
  ).toString("base64");
  const response = await fetch(
    `${getBaseUrl(credentials.environment)}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${authorization}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    }
  );
  const data = await readMpesaResponse<{ access_token?: string; error_description?: string }>(
    response,
    "Daraja authentication"
  );

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || "Unable to authenticate with M-Pesa");
  }
  return data.access_token;
}

function getTimestamp(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}${part("month")}${part("day")}${part("hour")}${part("minute")}${part("second")}`;
}

async function authorizedPost<T>(
  credentials: MpesaCredentials,
  path: string,
  payload: Record<string, string | number>
): Promise<T> {
  const accessToken = await getAccessToken(credentials);
  const response = await fetch(`${getBaseUrl(credentials.environment)}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const data = await readMpesaResponse<T & MpesaApiError>(response, "the M-Pesa request");

  if (!response.ok) {
    throw new Error(
      data.errorMessage || data.error_description || data.ResponseDescription || "M-Pesa request failed"
    );
  }
  return data;
}

export async function initiateStkPush(input: {
  amountKES: number;
  phoneNumber: string;
  accountReference: string;
}): Promise<StkPushResponse> {
  const credentials = getMpesaCredentials();
  const timestamp = getTimestamp();
  const password = Buffer.from(
    `${credentials.shortcode}${credentials.passkey}${timestamp}`
  ).toString("base64");

  const response = await authorizedPost<StkPushResponse>(
    credentials,
    "/mpesa/stkpush/v1/processrequest",
    {
      BusinessShortCode: credentials.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: input.amountKES,
      PartyA: input.phoneNumber,
      PartyB: credentials.shortcode,
      PhoneNumber: input.phoneNumber,
      CallBackURL: credentials.callbackUrl,
      AccountReference: input.accountReference,
      TransactionDesc: "AeroCrash wallet deposit",
    }
  );

  if (String(response.ResponseCode) !== "0" || !response.CheckoutRequestID || !response.MerchantRequestID) {
    throw new Error(response.ResponseDescription || "M-Pesa did not accept the STK Push request");
  }
  return response;
}

export async function queryStkPush(checkoutRequestId: string): Promise<StkQueryResponse> {
  const credentials = getMpesaCredentials();
  const timestamp = getTimestamp();
  const password = Buffer.from(
    `${credentials.shortcode}${credentials.passkey}${timestamp}`
  ).toString("base64");

  return authorizedPost<StkQueryResponse>(
    credentials,
    "/mpesa/stkpushquery/v1/query",
    {
      BusinessShortCode: credentials.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }
  );
}

export function normalizeKenyanPhoneNumber(phone: unknown): string | null {
  if (typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("0")
    ? `254${digits.slice(1)}`
    : digits.length === 9
      ? `254${digits}`
      : digits;

  return /^254[17]\d{8}$/.test(international) ? international : null;
}

export function getSafeMpesaErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("MPESA_CALLBACK_URL")) {
    return "The M-Pesa callback URL must be public HTTPS. Set MPESA_CALLBACK_URL to your deployed site's /api/cashier/mpesa/callback URL.";
  }
  if (message.includes("M-Pesa credentials are not completely configured")) {
    return "M-Pesa setup is incomplete. Check that the consumer key, consumer secret, shortcode, and passkey are configured for the same Daraja environment.";
  }
  if (
    /invalid credential|invalid consumer|unable to authenticate|access token|unauthorized/i.test(message)
  ) {
    return "Safaricom rejected the Daraja credentials. Confirm the consumer key, consumer secret, shortcode, and passkey all belong to the selected Sandbox or Production environment.";
  }
  if (/fetch failed|timed out|timeout|network|enotfound|econn/i.test(message)) {
    return "The app could not reach Safaricom. Check the Daraja environment and try again.";
  }

  const safeMessage = message
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\b(access_token|consumer_secret|passkey|password)\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .trim()
    .slice(0, 240);

  return safeMessage || "Safaricom did not accept the payment request. Check your M-Pesa number and try again.";
}

export function getDepositKESPerUsd(): number | null {
  const value =
    process.env.DEPOSIT_KES_PER_USD || process.env.WITHDRAWAL_KES_PER_USD;
  if (!value) return DEFAULT_KES_PER_USD;
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_KES_PER_USD;
}
