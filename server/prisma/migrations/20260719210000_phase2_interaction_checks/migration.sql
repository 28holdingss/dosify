-- CreateEnum
CREATE TYPE "InteractionCheckItemRole" AS ENUM ('PROPOSED', 'CABINET', 'RECENT_INTAKE');

-- CreateTable
CREATE TABLE "InteractionCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "freeText" TEXT,
    "includeCabinet" BOOLEAN NOT NULL DEFAULT true,
    "includeRecentIntakes" BOOLEAN NOT NULL DEFAULT true,
    "contextSnapshot" JSONB,
    "riskScore" INTEGER,
    "highestRisk" "RiskLevel",
    "disclaimer" TEXT NOT NULL,
    "aiRephrased" BOOLEAN NOT NULL DEFAULT false,
    "engineVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionCheckItem" (
    "id" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "substanceId" TEXT,
    "substanceName" TEXT NOT NULL,
    "role" "InteractionCheckItemRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionCheckItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionFinding" (
    "id" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "substanceAId" TEXT,
    "substanceBId" TEXT,
    "riskLevel" "RiskLevel" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "advice" TEXT,
    "source" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InteractionCheck_userId_createdAt_idx" ON "InteractionCheck"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InteractionCheckItem_checkId_idx" ON "InteractionCheckItem"("checkId");

-- CreateIndex
CREATE INDEX "InteractionCheckItem_substanceId_idx" ON "InteractionCheckItem"("substanceId");

-- CreateIndex
CREATE INDEX "InteractionFinding_checkId_idx" ON "InteractionFinding"("checkId");

-- AddForeignKey
ALTER TABLE "InteractionCheck" ADD CONSTRAINT "InteractionCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionCheckItem" ADD CONSTRAINT "InteractionCheckItem_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "InteractionCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionCheckItem" ADD CONSTRAINT "InteractionCheckItem_substanceId_fkey" FOREIGN KEY ("substanceId") REFERENCES "Substance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionFinding" ADD CONSTRAINT "InteractionFinding_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "InteractionCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
