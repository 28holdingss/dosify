-- CreateTable
CREATE TABLE "WearableSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'HEALTHKIT',
    "heartRateAvg" DOUBLE PRECISION,
    "restingHeartRate" DOUBLE PRECISION,
    "steps" INTEGER,
    "sleepHours" DOUBLE PRECISION,
    "activeEnergyKcal" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WearableSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WearableSnapshot_userId_recordedAt_idx" ON "WearableSnapshot"("userId", "recordedAt");

-- AddForeignKey
ALTER TABLE "WearableSnapshot" ADD CONSTRAINT "WearableSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
