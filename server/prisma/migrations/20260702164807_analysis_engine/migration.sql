-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "engineVersion" TEXT NOT NULL DEFAULT '1.0.0',
ADD COLUMN     "recommendations" JSONB,
ADD COLUMN     "warnings" JSONB;

-- CreateTable
CREATE TABLE "SubstanceProfile" (
    "id" TEXT NOT NULL,
    "substanceId" TEXT NOT NULL,
    "drugClass" TEXT,
    "halfLifeHours" DOUBLE PRECISION,
    "cognitiveImpact" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "cardiovascularImpact" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "gastrointestinalImpact" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "liverImpact" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "typicalDurationMinHours" DOUBLE PRECISION,
    "typicalDurationMaxHours" DOUBLE PRECISION,
    "maxDailyDose" DOUBLE PRECISION,

    CONSTRAINT "SubstanceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionRule" (
    "id" TEXT NOT NULL,
    "substanceA" TEXT NOT NULL,
    "substanceB" TEXT NOT NULL,
    "substanceAClass" TEXT,
    "substanceBClass" TEXT,
    "riskLevel" "RiskLevel" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "advice" TEXT,
    "source" TEXT,

    CONSTRAINT "InteractionRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubstanceProfile_substanceId_key" ON "SubstanceProfile"("substanceId");

-- CreateIndex
CREATE INDEX "InteractionRule_substanceA_substanceB_idx" ON "InteractionRule"("substanceA", "substanceB");

-- CreateIndex
CREATE INDEX "InteractionRule_substanceAClass_substanceBClass_idx" ON "InteractionRule"("substanceAClass", "substanceBClass");

-- AddForeignKey
ALTER TABLE "SubstanceProfile" ADD CONSTRAINT "SubstanceProfile_substanceId_fkey" FOREIGN KEY ("substanceId") REFERENCES "Substance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
