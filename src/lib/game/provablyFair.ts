import crypto from 'crypto';

export function generateRoundCrash(roundNumber: number) {
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const clientSeed = '000000000000000000041e12e3';
  const nonce = roundNumber;

  const message = `${clientSeed}:${nonce}`;
  const hash = crypto.createHmac('sha256', serverSeed).update(message).digest('hex');

  // Grab first 52 bits
  const subHash = hash.substring(0, 13);
  const h = parseInt(subHash, 16);
  const e = Math.pow(2, 52);

  // 3% house edge (97% RTP)
  if (h % 33 === 0) {
    return { crashMultiplier: 1.00, hash, serverSeed, clientSeed };
  }

  const raw = Math.floor((100 * e - h * 100) / (e - h)) / 100;
  const crashMultiplier = Math.max(1.00, parseFloat(raw.toFixed(2)));

  return { crashMultiplier, hash, serverSeed, clientSeed };
}
