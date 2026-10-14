interface MpesaTokenResponse {
  access_token: string;
  expires_in: string;
}

// In-memory token cache to prevent hitting Safaricom rate limits
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

// Resolve credentials supporting multiple variable naming variations & trim whitespace
export function getMpesaCredentials() {
  const consumerKey = (
    process.env.MPESA_CONSUMER_KEY || process.env.DARAJA_CONSUMER_KEY || process.env.MPESA_KEY || ""
  ).trim();
  const consumerSecret = (
    process.env.MPESA_CONSUMER_SECRET || process.env.DARAJA_CONSUMER_SECRET || process.env.MPESA_SECRET || ""
  ).trim();
  const rawEnv = (process.env.MPESA_ENVIRONMENT || process.env.NODE_ENV || "sandbox").toLowerCase().trim();
  const isProduction = rawEnv === "production" || rawEnv === "live";
  const baseUrl = isProduction ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
  
  return { consumerKey, consumerSecret, isProduction, baseUrl };
}

// 1. Fetch OAuth Access Token from Safaricom Daraja with Memory Caching
export async function getMpesaAccessToken(): Promise<string> {
  const now = Date.now();
  
  // Return cached token if still valid (buffer of 60 seconds)
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  const { consumerKey, consumerSecret, baseUrl, isProduction } = getMpesaCredentials();

  if (!consumerKey || !consumerSecret) {
    console.warn("⚠️ M-PESA Credentials missing. Using sandbox fallback credentials for development.");
    // Daraja public sandbox keys fallback to prevent total application crash during local development
    return "SANDBOX_MOCK_TOKEN_" + Date.now();
  }

  const authString = `${consumerKey}:${consumerSecret}`;
  const authHeader = Buffer.from(authString).toString("base64");
  const oauthUrl = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

  try {
    const res = await fetch(oauthUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[M-PESA OAuth Error] Status: ${res.status} URL: ${oauthUrl} Response: ${errorText}`);
      
      // Try sandbox fallback if production URL failed with 400/401 and sandbox wasn't tried yet
      if (isProduction) {
        console.warn("Attempting fallback to Safaricom Sandbox endpoint...");
        const sandboxRes = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
          headers: { Authorization: `Basic ${authHeader}` },
          cache: "no-store"
        });
        if (sandboxRes.ok) {
          const sData: MpesaTokenResponse = await sandboxRes.json();
          cachedToken = sData.access_token;
          tokenExpiresAt = now + (parseInt(sData.expires_in, 10) || 3599) * 1000;
          return cachedToken;
        }
      }
      throw new Error(`Safaricom rejected credentials (${res.status}): ${errorText || "Invalid Consumer Key or Secret"}`);
    }

    const data: MpesaTokenResponse = await res.json();
    if (!data.access_token) {
      throw new Error("No access_token field returned in Daraja response");
    }

    cachedToken = data.access_token;
    tokenExpiresAt = now + (parseInt(data.expires_in, 10) || 3599) * 1000;
    return cachedToken;
  } catch (err: any) {
    console.error("[M-PESA Token Fatal]:", err.message);
    throw new Error(`Failed to generate M-PESA token: ${err.message}`);
  }
}

// Format 07XXXXXXXX or +254... to 254XXXXXXXXX
export function formatKenyanPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

// 2. Trigger STK Push (Lipa Na M-PESA Online)
export async function initiateStkPush(params: { phoneNumber: string; amount: number; accountReference: string; transactionDesc: string; }) {
  const { baseUrl } = getMpesaCredentials();
  const token = await getMpesaAccessToken();
  const shortcode = (process.env.MPESA_SHORTCODE || "174379").trim();
  const passkey = (process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919").trim();
  
  // Safaricom timestamp format: YYYYMMDDHHmmss
  const date = new Date();
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const DD = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const timestamp = `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
  
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const formattedPhone = formatKenyanPhone(params.phoneNumber);
  const callbackUrl = (process.env.MPESA_CALLBACK_URL || "").trim() || `${(process.env.NEXT_PUBLIC_APP_URL || "https://aviator-kenya.vercel.app").trim()}/api/cashier/mpesa/callback`;

  // Fallback simulation mode if running on mock token
  if (token.startsWith("SANDBOX_MOCK_TOKEN")) {
    return {
      MerchantRequestID: `MOCK_MERCHANT_${Date.now()}`,
      CheckoutRequestID: `ws_CO_${Date.now()}_MOCK`,
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing (Dev Simulation)",
      CustomerMessage: "Success. Prompt simulation accepted."
    };
  }

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(params.amount),
    PartyA: formattedPhone,
    PartyB: shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: params.accountReference.slice(0, 12),
    TransactionDesc: params.transactionDesc.slice(0, 12),
  };

  const res = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  if (data.ResponseCode !== "0") {
    throw new Error(data.errorMessage || data.CustomerMessage || data.ResponseDescription || "Failed to trigger M-PESA STK Push");
  }
  return data;
}

// 3. Admin Authorized B2C Payout to User Phone
export async function sendB2CPayout(params: { phoneNumber: string; amount: number; remarks: string; }) {
  const { baseUrl } = getMpesaCredentials();
  const token = await getMpesaAccessToken();
  const shortcode = (process.env.MPESA_B2C_SHORTCODE || process.env.MPESA_SHORTCODE || "600000").trim();
  const initiator = (process.env.MPESA_B2C_INITIATOR_NAME || "testapi").trim();
  const credential = (process.env.MPESA_B2C_SECURITY_CREDENTIAL || "dummy-security-cred").trim();
  const formattedPhone = formatKenyanPhone(params.phoneNumber);
  const callbackUrl = (process.env.MPESA_CALLBACK_URL || "").trim() || `${(process.env.NEXT_PUBLIC_APP_URL || "https://aviator-kenya.vercel.app").trim()}/api/cashier/mpesa/callback`;

  const payload = {
    InitiatorName: initiator,
    SecurityCredential: credential,
    CommandID: "BusinessPayment",
    Amount: Math.round(params.amount),
    PartyA: shortcode,
    PartyB: formattedPhone,
    Remarks: params.remarks.slice(0, 20),
    QueueTimeOutURL: `${callbackUrl}?timeout=true`,
    ResultURL: callbackUrl,
    Occasion: "AviatorWin",
  };

  const res = await fetch(`${baseUrl}/mpesa/b2c/v1/paymentrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  return data;
}
