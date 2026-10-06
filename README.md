# Aviator-web

## Withdrawals and payment setup

The app in `aviator-pro` supports withdrawal requests through M-PESA, Airtel Money, and bank wire. Requests reserve the user's withdrawable balance until an admin approves or rejects them. Admins must make approved payouts manually, then record the payment in the admin dashboard; rejection refunds the reserved amount.

Before enabling withdrawal review in production, configure these server-side environment variables in the deployment platform:

- `ADMIN_USER_IDS`: comma-separated MongoDB user IDs allowed to access `/admin/withdrawals`.
- `WITHDRAWAL_KES_PER_USD`: configured KES per USD conversion rate.
- `WITHDRAWAL_UGX_PER_USD`: configured UGX per USD conversion rate.

The withdrawal flow uses MongoDB transactions, so the database must support transactions (for example, MongoDB Atlas or a replica set). Do not put these values in client-side environment variables.

Deposits are deliberately disabled until a verified payment provider and its confirmation callbacks are implemented. New accounts start with zero balance, and only server-settled game payouts increase withdrawable funds. Do not treat a client-side payment prompt or receipt as proof of payment.
