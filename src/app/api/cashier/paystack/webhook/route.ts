import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Transaction } from '@/lib/db/models/Transaction';
import { User } from '@/lib/db/models/User';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_WEBHOOK_SECRET;

    if (secret && signature) {
      const hash = crypto
        .createHmac('sha512', secret)
        .update(rawBody)
        .digest('hex');

      if (hash !== signature) {
        return NextResponse.json({ error: 'Invalid Paystack signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      await connectToDatabase();
      const { reference, channel, id: paystackId } = event.data;
      const metadata = event.data.metadata || {};
      const amountUSD = Number(metadata.amountUSD) || 100;

      const tx = await Transaction.findOne({ reference });
      if (tx && tx.status === 'pending') {
        tx.status = 'success';
        tx.paystackId = String(paystackId);
        tx.channel = channel;
        await tx.save();

        const bonusMatch = Math.min(amountUSD, 1000.0);

        await User.findByIdAndUpdate(tx.userId, {
          $inc: {
            balanceUSD: amountUSD,
            bonusBalanceUSD: bonusMatch,
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
