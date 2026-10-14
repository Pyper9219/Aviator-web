interface MpesaTokenResponse {
  access_token: string;
  expires_in: string;
}

const getBaseUrl = () => {
  return process.env.MPESA_ENVIRONMENT === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
};

export async function getMpesaAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) {
    throw new Error("M-PESA consumer key and secret not configured in environment variables.");
  }
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const res = await fetch(`${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to generate M-PESA token: ${errorText}`);
  }
  const data: MpesaTokenResponse = await res.json();
  return data.access_token;
}

export function formatKenyanPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

export async function initiateStkPush(params: { phoneNumber: string; amount: number; accountReference: string; transactionDesc: string; }) {
  const token = await getMpesaAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE || "174379";
  const passkey = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const formattedPhone = formatKenyanPhone(params.phoneNumber);
  const callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL || "https://aviator-kenya.vercel.app"}/api/cashier/mpesa/callback`;

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

  const res = await fetch(`${getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.ResponseCode !== "0") {
    throw new Error(data.errorMessage || data.CustomerMessage || "Failed to trigger M-PESA STK Push");
  }
  return data;
}

export async function sendB2CPayout(params: { phoneNumber: string; amount: number; remarks: string; }) {
  const token = await getMpesaAccessToken();
  const shortcode = process.env.MPESA_B2C_SHORTCODE || process.env.MPESA_SHORTCODE || "600000";
  const initiator = process.env.MPESA_B2C_INITIATOR_NAME || "testapi";
  const credential = process.env.MPESA_B2C_SECURITY_CREDENTIAL || "dummy-security-cred";
  const formattedPhone = formatKenyanPhone(params.phoneNumber);
  const callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL || "https://aviator-kenya.vercel.app"}/api/cashier/mpesa/callback`;

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

  const res = await fetch(`${getBaseUrl()}/mpesa/b2c/v1/paymentrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data;
}
