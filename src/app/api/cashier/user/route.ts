import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        username: 'Pilot_Ace',
        email: 'pilot@aerocrash.game',
        balanceUSD: 4850.50,
        bonusBalanceUSD: 100.00,
        vipLevel: 3,
      });
    }
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({
      user: {
        _id: 'mock_user_1',
        username: 'Pilot_Ace',
        email: 'pilot@aerocrash.game',
        balanceUSD: 4850.50,
        bonusBalanceUSD: 100.00,
        vipLevel: 3,
      }
    });
  }
}
