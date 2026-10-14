# Aviator-web

## Withdrawals and payment setup

The app in `aviator-pro` supports withdrawal requests through M-PESA, Airtel Money, and bank wire. Requests reserve the user's withdrawable balance until an admin approves or rejects them. Admins must make approved payouts manually, then record the payment in the admin dashboard; rejection refunds the reserved amount.

Before enabling withdrawal review in production, configure these server-side environment variables in the deployment platform:

- `ADMIN_USER_IDS`: comma-separated MongoDB user IDs allowed to access `/admin/withdrawals`.
- `WITHDRAWAL_KES_PER_USD`: optional KES per USD conversion rate; defaults to KSh 130 per USD when unset.
- `WITHDRAWAL_UGX_PER_USD`: configured UGX per USD conversion rate.

The dashboard displays USD-accounted balances in KES using `WITHDRAWAL_KES_PER_USD`; betting, settlement, and stored balances remain denominated in USD. The withdrawal flow uses MongoDB transactions, so the database must support transactions (for example, MongoDB Atlas or a replica set). Do not put these values in client-side environment variables.

New accounts start with zero balance. Deposits are only credited after verified server-side payment confirmation; do not treat a client-side payment prompt or receipt as proof of payment.

## M-Pesa deposits and withdrawals

The cashier supports Safaricom Daraja STK Push deposits. Keep these credentials server-side in Vercel; never use `NEXT_PUBLIC_` for secrets:

- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE` (the Daraja sandbox test shortcode is `174379`)
- `MPESA_PASSKEY`
- `MPESA_ENVIRONMENT` (`sandbox` by default; use `production` only with live Daraja credentials)
- `MPESA_CALLBACK_URL` (public HTTPS callback URL; if omitted, Vercel's production URL, deployment URL, or `NEXT_PUBLIC_APP_URL` is used with `/api/cashier/mpesa/callback`)
- `DEPOSIT_KES_PER_USD` (optional deposit conversion override) or `WITHDRAWAL_KES_PER_USD` (KES credited per USD ledger unit; defaults to KSh 130 per USD)

The default exchange rate is a rounded display/conversion fallback, not a guaranteed market or Safaricom rate; configure the server-side rate to the rate you intend to apply. The callback verifies the STK transaction with Safaricom before crediting the wallet. The database must support MongoDB transactions. M-Pesa withdrawals are KES-only and remain admin-approved/manual payouts; STK Push credentials do not enable automatic B2C disbursements. For sandbox deposits, use a Safaricom sandbox test MSISDN; live phone numbers do not receive sandbox STK prompts. Test with sandbox credentials before enabling live mode.
