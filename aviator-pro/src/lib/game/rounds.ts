import { createHash, createHmac, randomBytes } from "crypto";
import { GameRound, IGameRoundDoc } from "@/lib/db/models/GameRound";
import { Bet } from "@/lib/db/models/Bet";
import { connectToDatabase } from "@/lib/db/mongodb";

const COUNTDOWN_MS = 5_000;
const POST_CRASH_MS = 3_200;
const GROWTH_RATE = 0.07;
const MAX_CRASH_MULTIPLIER = 10_000;

function buildRound(roundNumber: number, startsAt: Date): Partial<IGameRoundDoc> {
  const serverSeed = randomBytes(32).toString("hex");
  const digest = createHmac("sha256", serverSeed).update(String(roundNumber)).digest("hex");
  const sample = BigInt(`0x${digest.slice(0, 8)}`);
  const denominator = BigInt("4294967296");
  const rawCents = (BigInt(99) * denominator) / (denominator - sample);
  const cents = Math.min(MAX_CRASH_MULTIPLIER * 100, Math.max(101, Number(rawCents)));

  return {
    roundNumber,
    phase: "PREPARING",
    startsAt,
    crashMultiplier: cents / 100,
    serverSeed,
    seedHash: createHash("sha256").update(serverSeed).digest("hex")
  };
}

export async function getCurrentGameRound(): Promise<IGameRoundDoc> {
  await connectToDatabase();
  let round = await GameRound.findById("current");

  if (!round) {
    const now = new Date();
    try {
      round = await GameRound.create({
        _id: "current",
        ...buildRound(1, new Date(now.getTime() + COUNTDOWN_MS))
      });
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === 11000)) throw error;
      round = await GameRound.findById("current");
      if (!round) throw new Error("Unable to initialize current game round");
    }
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const now = new Date();

    if (round.phase === "PREPARING" && now >= round.startsAt) {
      await GameRound.updateOne(
        { _id: "current", roundNumber: round.roundNumber, phase: "PREPARING" },
        { $set: { phase: "IN_FLIGHT", startedAt: round.startsAt } }
      );
    } else if (round.phase === "IN_FLIGHT") {
      const startedAt = round.startedAt ?? round.startsAt;
      const crashDurationMs = Math.log(round.crashMultiplier) / GROWTH_RATE * 1_000;
      const crashAt = new Date(startedAt.getTime() + crashDurationMs);
      if (now >= crashAt) {
        await GameRound.updateOne(
          { _id: "current", roundNumber: round.roundNumber, phase: "IN_FLIGHT" },
          { $set: { phase: "CRASHED", crashAt } }
        );
        await Bet.updateMany(
          { roundNumber: round.roundNumber, status: "ACTIVE" },
          { $set: { status: "LOST" } }
        );
      }
    } else if (round.phase === "CRASHED" && round.crashAt && now.getTime() >= round.crashAt.getTime() + POST_CRASH_MS) {
      const nextRound = buildRound(round.roundNumber + 1, new Date(now.getTime() + COUNTDOWN_MS));
      await GameRound.updateOne(
        { _id: "current", roundNumber: round.roundNumber, phase: "CRASHED" },
        { $set: nextRound }
      );
    }

    const refreshed = await GameRound.findById("current");
    if (!refreshed) throw new Error("Current game round disappeared");
    round = refreshed;

    const refreshedAt = new Date();
    const transitioned =
      (round.phase === "PREPARING" && refreshedAt >= round.startsAt) ||
      (round.phase === "IN_FLIGHT" && refreshedAt >= new Date((round.startedAt ?? round.startsAt).getTime() + Math.log(round.crashMultiplier) / GROWTH_RATE * 1_000)) ||
      (round.phase === "CRASHED" && !!round.crashAt && refreshedAt.getTime() >= round.crashAt.getTime() + POST_CRASH_MS);
    if (!transitioned) return round;
  }

  return round;
}

export function getRoundMultiplier(round: IGameRoundDoc, now = new Date()): number {
  if (round.phase === "PREPARING") return 1;
  if (round.phase === "CRASHED") return round.crashMultiplier;

  const startedAt = round.startedAt ?? round.startsAt;
  const elapsedSeconds = Math.max(0, (now.getTime() - startedAt.getTime()) / 1_000);
  return Math.min(round.crashMultiplier, Math.floor(Math.exp(GROWTH_RATE * elapsedSeconds) * 100) / 100);
}
