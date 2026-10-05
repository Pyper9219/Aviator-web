import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Transaction } from '@/lib/db/models/Transaction';
import { User } from '@/lib/db/models/User';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { amountUSD, email, currency = 'NGN' } = await req.json();

    if (!amountUSD || amountUSD <= 0) {
      return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 });
    }

    const EXCHANGE_RATE = 1450;
    const localAmount = amountUSD * EXCHANGE_RATE;
    const koboAmount = Math.round(localAmount * 100);

    const reference = `AVIATOR_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json({
        success: true,
        reference,
        authorizationUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/cashier?success=mock&ref=${reference}`,
        message: 'Mock payment checkout initialized (Set PAYSTACK_SECRET_KEY in .env.local to enable live)',
      });
    }

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email || 'user@aerocrash.game',
        amount: koboAmount,
        currency,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/cashier?status=complete`,
        metadata: {
          amountUSD,
          boosterMatch: true,
        },
      }),
    });

    const data = await paystackRes.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message || 'Paystack init failed' }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const user = await User.findOne();
      if (user) {
        await Transaction.create({
          userId: user._id,
          reference,
          amountLocal: localAmount,
          amountUSD,
          currency,
          status: 'pending',
          boosterApplied: true,
        });
      }
    } catch (e) {
      console.error('Database transaction record error:', e);
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
