-- Body systems: kidney + respiratory (and persist liver on Analysis)
ALTER TABLE "SubstanceProfile" ADD COLUMN IF NOT EXISTS "kidneyImpact" DOUBLE PRECISION NOT NULL DEFAULT 0.1;
ALTER TABLE "SubstanceProfile" ADD COLUMN IF NOT EXISTS "respiratoryImpact" DOUBLE PRECISION NOT NULL DEFAULT 0.1;

ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "liverScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "kidneyScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "respiratoryScore" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "RecoverySnapshot" ADD COLUMN IF NOT EXISTS "kidneyPct" INTEGER NOT NULL DEFAULT 70;
ALTER TABLE "RecoverySnapshot" ADD COLUMN IF NOT EXISTS "respiratoryPct" INTEGER NOT NULL DEFAULT 70;

-- Heuristic profile bumps for common renal / respiratory-load substances
UPDATE "SubstanceProfile" sp
SET "kidneyImpact" = GREATEST(sp."kidneyImpact", 0.45)
FROM "Substance" s
WHERE s.id = sp."substanceId"
  AND (
    LOWER(s.name) LIKE '%ibuprofen%'
    OR LOWER(s.name) LIKE '%naproxen%'
    OR LOWER(s.name) LIKE '%lithium%'
    OR LOWER(s.name) LIKE '%metformin%'
    OR LOWER(COALESCE(sp."drugClass", '')) LIKE '%nsaid%'
  );

UPDATE "SubstanceProfile" sp
SET "respiratoryImpact" = GREATEST(sp."respiratoryImpact", 0.5)
FROM "Substance" s
WHERE s.id = sp."substanceId"
  AND (
    LOWER(COALESCE(sp."drugClass", '')) LIKE '%opioid%'
    OR LOWER(COALESCE(sp."drugClass", '')) LIKE '%benzo%'
    OR LOWER(COALESCE(sp."drugClass", '')) LIKE '%sedat%'
    OR LOWER(s.name) LIKE '%codeine%'
    OR LOWER(s.name) LIKE '%oxycodone%'
    OR LOWER(s.name) LIKE '%morphine%'
    OR LOWER(s.name) LIKE '%tramadol%'
    OR LOWER(s.name) LIKE '%alprazolam%'
  );
