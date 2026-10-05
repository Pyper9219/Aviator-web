import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Bet } from '@/lib/db/models/Bet';

export async function POST(req: NextRequest) {
  try {
    const { betId, multiplier, stakeAmount } = await req.json();

    const payout = parseFloat((stakeAmount * multiplier).toFixed(2));
    const profit = parseFloat((payout - stakeAmount).toFixed(2));

    try {
      await connectToDatabase();
      const user = await User.findOne();

      if (user) {
        user.balanceUSD += payout;
        await user.save();

        if (betId && !betId.startsWith('mock_')) {
          await Bet.findByIdAndUpdate(betId, {
            cashedOut: true,
            cashedOutMultiplier: multiplier,
            payoutAmount: payout,
            status: 'CASHED_OUT',
          });
        }

        return NextResponse.json({
          success: true,
          multiplier,
          payout,
          profit,
          newBalance: user.balanceUSD,
        });
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      multiplier,
      payout,
      profit,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
