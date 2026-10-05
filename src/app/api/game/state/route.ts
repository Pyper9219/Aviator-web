import { NextResponse } from 'next/server';
import { generateRoundCrash } from '@/lib/game/provablyFair';

export async function GET() {
  const roundNumber = 948202;
  const roundData = generateRoundCrash(roundNumber);

  return NextResponse.json({
    roundNumber,
    crashMultiplier: roundData.crashMultiplier,
    hash: roundData.hash,
    history: [4.82, 1.24, 3.15, 14.80, 1.02, 2.64, 5.12, 1.14, 2.45, 18.90],
  });
}
