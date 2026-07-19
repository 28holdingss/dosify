-- CreateEnum
CREATE TYPE "ConditionStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ConsentScope" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'HEALTH_DATA_PROCESSING', 'WEARABLE_SYNC', 'AI_ANALYSIS');

-- CreateEnum
CREATE TYPE "ScheduleRecurrence" AS ENUM ('DAILY', 'WEEKDAYS', 'WEEKLY', 'INTERVAL');

-- CreateEnum
CREATE TYPE "DoseStatus" AS ENUM ('DUE', 'TAKEN', 'SKIPPED', 'SNOOZED', 'MISSED');

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ConditionStatus" NOT NULL DEFAULT 'ACTIVE',
    "onsetAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "reaction" TEXT,
    "severity" "AllergySeverity" NOT NULL DEFAULT 'UNKNOWN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "ConsentScope" NOT NULL,
    "version" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceSource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "publisher" TEXT,
    "publishedAt" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceCitation" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "quote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CabinetItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "substanceId" TEXT NOT NULL,
    "displayName" TEXT,
    "doseValue" DOUBLE PRECISION,
    "doseUnit" TEXT,
    "strengthValue" DOUBLE PRECISION,
    "strengthUnit" TEXT,
    "quantity" DOUBLE PRECISION,
    "expirationDate" TIMESTAMP(3),
    "refillDate" TIMESTAMP(3),
    "prescriber" TEXT,
    "instructions" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CabinetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cabinetItemId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "recurrence" "ScheduleRecurrence" NOT NULL,
    "times" JSONB,
    "intervalHours" INTEGER,
    "daysOfWeek" JSONB,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "instructions" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoseEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "cabinetItemId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "DoseStatus" NOT NULL DEFAULT 'DUE',
    "actedAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Condition_userId_status_idx" ON "Condition"("userId", "status");

-- CreateIndex
CREATE INDEX "Allergy_userId_idx" ON "Allergy"("userId");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_scope_idx" ON "ConsentRecord"("userId", "scope");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_createdAt_idx" ON "AuditEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "EvidenceCitation_sourceId_idx" ON "EvidenceCitation"("sourceId");

-- CreateIndex
CREATE INDEX "EvidenceCitation_entityType_entityId_idx" ON "EvidenceCitation"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "CabinetItem_userId_active_idx" ON "CabinetItem"("userId", "active");

-- CreateIndex
CREATE INDEX "CabinetItem_substanceId_idx" ON "CabinetItem"("substanceId");

-- CreateIndex
CREATE INDEX "MedicationSchedule_userId_active_idx" ON "MedicationSchedule"("userId", "active");

-- CreateIndex
CREATE INDEX "MedicationSchedule_cabinetItemId_idx" ON "MedicationSchedule"("cabinetItemId");

-- CreateIndex
CREATE UNIQUE INDEX "DoseEvent_scheduleId_scheduledFor_key" ON "DoseEvent"("scheduleId", "scheduledFor");

-- CreateIndex
CREATE INDEX "DoseEvent_userId_scheduledFor_idx" ON "DoseEvent"("userId", "scheduledFor");

-- CreateIndex
CREATE INDEX "DoseEvent_userId_status_scheduledFor_idx" ON "DoseEvent"("userId", "status", "scheduledFor");

-- CreateIndex
CREATE INDEX "DoseEvent_cabinetItemId_idx" ON "DoseEvent"("cabinetItemId");

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceCitation" ADD CONSTRAINT "EvidenceCitation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "EvidenceSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CabinetItem" ADD CONSTRAINT "CabinetItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CabinetItem" ADD CONSTRAINT "CabinetItem_substanceId_fkey" FOREIGN KEY ("substanceId") REFERENCES "Substance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationSchedule" ADD CONSTRAINT "MedicationSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationSchedule" ADD CONSTRAINT "MedicationSchedule_cabinetItemId_fkey" FOREIGN KEY ("cabinetItemId") REFERENCES "CabinetItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseEvent" ADD CONSTRAINT "DoseEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseEvent" ADD CONSTRAINT "DoseEvent_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "MedicationSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseEvent" ADD CONSTRAINT "DoseEvent_cabinetItemId_fkey" FOREIGN KEY ("cabinetItemId") REFERENCES "CabinetItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
