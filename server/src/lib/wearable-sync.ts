import type { PrismaClient } from '@prisma/client';

export type WearableSyncInput = {
  heartRateAvg?: number | null;
  restingHeartRate?: number | null;
  steps?: number | null;
  sleepHours?: number | null;
  activeEnergyKcal?: number | null;
  source?: string;
  recordedAt?: string;
};

export function deriveSleepPct(hours: number | null | undefined): number | null {
  if (hours == null) return null;
  if (hours >= 7 && hours <= 9) return 92;
  if (hours >= 6.5) return 82;
  if (hours >= 6) return 72;
  if (hours >= 5) return 58;
  return 42;
}

export function deriveCardiovascularPct(restingHeartRate: number | null | undefined): number | null {
  if (restingHeartRate == null) return null;
  if (restingHeartRate <= 55) return 94;
  if (restingHeartRate <= 65) return 86;
  if (restingHeartRate <= 75) return 76;
  if (restingHeartRate <= 85) return 64;
  return 52;
}

export function deriveRecoveryFromWearable(input: WearableSyncInput) {
  const sleepPct = deriveSleepPct(input.sleepHours);
  const cardiovascularPct = deriveCardiovascularPct(input.restingHeartRate);

  const parts = [sleepPct, cardiovascularPct].filter((v): v is number => v != null);
  if (parts.length === 0) return null;

  const score = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);

  return {
    score,
    sleepPct: sleepPct ?? 70,
    cardiovascularPct: cardiovascularPct ?? 70,
    cognitivePct: sleepPct != null ? Math.min(96, sleepPct + 4) : 72,
    liverPct: 70,
  };
}

export async function applyWearableToRecovery(
  userId: string,
  input: WearableSyncInput,
  prisma: PrismaClient
) {
  const wearableRecovery = deriveRecoveryFromWearable(input);
  if (!wearableRecovery) return null;

  const latest = await prisma.recoverySnapshot.findFirst({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
  });

  const blend = (watch: number, existing: number) =>
    Math.round(watch * 0.55 + existing * 0.45);

  const data = latest
    ? {
        score: blend(wearableRecovery.score, latest.score),
        cognitivePct: blend(wearableRecovery.cognitivePct, latest.cognitivePct),
        cardiovascularPct: blend(
          wearableRecovery.cardiovascularPct,
          latest.cardiovascularPct
        ),
        liverPct: latest.liverPct,
        sleepPct: blend(wearableRecovery.sleepPct, latest.sleepPct),
        estimatedRecoveryAt: latest.estimatedRecoveryAt,
      }
    : {
        ...wearableRecovery,
        estimatedRecoveryAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      };

  return prisma.recoverySnapshot.create({ data: { userId, ...data } });
}
