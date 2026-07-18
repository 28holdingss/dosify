-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "IntakeMethod" AS ENUM ('ORAL', 'TOPICAL', 'INJECTION', 'INHALATION', 'OTHER');

-- CreateEnum
CREATE TYPE "IntakeStatus" AS ENUM ('DRAFT', 'LOGGED', 'ANALYZED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INTERACTION_ALERT', 'HYDRATION_REMINDER', 'MEDICATION_REMINDER', 'GOAL_SUCCESS', 'GENERAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "gender" "Gender",
    "medicalConditions" TEXT,
    "allergies" TEXT,
    "emergencyInfo" TEXT,

    CONSTRAINT "HealthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstanceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "SubstanceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Substance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "defaultUnit" TEXT NOT NULL DEFAULT 'mg',
    "minDose" DOUBLE PRECISION,
    "maxDose" DOUBLE PRECISION,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Substance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "substanceId" TEXT NOT NULL,
    "dose" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL,
    "method" "IntakeMethod" NOT NULL DEFAULT 'ORAL',
    "purpose" TEXT,
    "status" "IntakeStatus" NOT NULL DEFAULT 'LOGGED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "intakeLogId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "cognitiveScore" INTEGER NOT NULL,
    "cardiovascularScore" INTEGER NOT NULL,
    "gastrointestinalScore" INTEGER NOT NULL,
    "interactionRiskScore" INTEGER NOT NULL,
    "durationMinHours" DOUBLE PRECISION,
    "durationMaxHours" DOUBLE PRECISION,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "substanceAId" TEXT NOT NULL,
    "substanceBId" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "advice" TEXT,
    "snoozedUntil" TIMESTAMP(3),
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoverySnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "cognitivePct" INTEGER NOT NULL,
    "cardiovascularPct" INTEGER NOT NULL,
    "liverPct" INTEGER NOT NULL,
    "sleepPct" INTEGER NOT NULL,
    "estimatedRecoveryAt" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoverySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HealthProfile_userId_key" ON "HealthProfile"("userId");

-- CreateIndex
CREATE INDEX "HealthGoal_userId_idx" ON "HealthGoal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SubstanceCategory_name_key" ON "SubstanceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubstanceCategory_slug_key" ON "SubstanceCategory"("slug");

-- CreateIndex
CREATE INDEX "Substance_categoryId_idx" ON "Substance"("categoryId");

-- CreateIndex
CREATE INDEX "Substance_name_idx" ON "Substance"("name");

-- CreateIndex
CREATE INDEX "IntakeLog_userId_takenAt_idx" ON "IntakeLog"("userId", "takenAt");

-- CreateIndex
CREATE INDEX "IntakeLog_substanceId_idx" ON "IntakeLog"("substanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_intakeLogId_key" ON "Analysis"("intakeLogId");

-- CreateIndex
CREATE INDEX "Interaction_userId_idx" ON "Interaction"("userId");

-- CreateIndex
CREATE INDEX "RecoverySnapshot_userId_recordedAt_idx" ON "RecoverySnapshot"("userId", "recordedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "HealthProfile" ADD CONSTRAINT "HealthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthGoal" ADD CONSTRAINT "HealthGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substance" ADD CONSTRAINT "Substance_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SubstanceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeLog" ADD CONSTRAINT "IntakeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeLog" ADD CONSTRAINT "IntakeLog_substanceId_fkey" FOREIGN KEY ("substanceId") REFERENCES "Substance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_intakeLogId_fkey" FOREIGN KEY ("intakeLogId") REFERENCES "IntakeLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_substanceAId_fkey" FOREIGN KEY ("substanceAId") REFERENCES "Substance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_substanceBId_fkey" FOREIGN KEY ("substanceBId") REFERENCES "Substance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoverySnapshot" ADD CONSTRAINT "RecoverySnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
