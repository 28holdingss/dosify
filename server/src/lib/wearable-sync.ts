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

/** Soft vitality signal from today's movement — never drives recovery alone. */
export function deriveActivityPct(
  steps: number | null | undefined,
  activeEnergyKcal: number | null | undefined
): number | null {
  if (steps == null && activeEnergyKcal == null) return null;

  const stepScore =
    steps == null
      ? null
      : steps >= 10000
        ? 90
        : steps >= 7500
          ? 84
          : steps >= 5000
            ? 76
            : steps >= 2500
              ? 66
              : 52;

  const energyScore =
    activeEnergyKcal == null
      ? null
      : activeEnergyKcal >= 500
        ? 88
        : activeEnergyKcal >= 300
          ? 80
          : activeEnergyKcal >= 150
            ? 70
            : 58;

  const parts = [stepScore, energyScore].filter((v): v is number => v != null);
  if (parts.length === 0) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

export function deriveRecoveryFromWearable(input: WearableSyncInput) {
  const sleepPct = deriveSleepPct(input.sleepHours);
  const cardiovascularPct = deriveCardiovascularPct(input.restingHeartRate);
  const activityPct = deriveActivityPct(input.steps, input.activeEnergyKcal);

  // Sleep + RHR are primary; activity only participates when a primary metric exists.
  const primary = [sleepPct, cardiovascularPct].filter((v): v is number => v != null);
  if (primary.length === 0) return null;

  const parts = activityPct != null ? [...primary, activityPct] : primary;
  const score = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);

  return {
    score,
    sleepPct: sleepPct ?? 70,
    cardiovascularPct: cardiovascularPct ?? 70,
    cognitivePct: sleepPct != null ? Math.min(96, sleepPct + 4) : 72,
    liverPct: 70,
    activityPct: activityPct ?? null,
  };
}

const RECOVERY_UPDATE_WINDOW_MS = 2 * 60 * 60 * 1000;

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
        score: wearableRecovery.score,
        sleepPct: wearableRecovery.sleepPct,
        cardiovascularPct: wearableRecovery.cardiovascularPct,
        cognitivePct: wearableRecovery.cognitivePct,
        liverPct: wearableRecovery.liverPct,
        estimatedRecoveryAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      };

  const recentEnough =
    latest != null &&
    Date.now() - latest.recordedAt.getTime() < RECOVERY_UPDATE_WINDOW_MS;

  if (recentEnough && latest) {
    return prisma.recoverySnapshot.update({
      where: { id: latest.id },
      data,
    });
  }

  return prisma.recoverySnapshot.create({ data: { userId, ...data } });
}
