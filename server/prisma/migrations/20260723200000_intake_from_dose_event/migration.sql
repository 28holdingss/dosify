-- Link scheduled "taken" doses to IntakeLog so they appear in Recent Activity
-- and interaction recent-intake windows.
ALTER TABLE "IntakeLog" ADD COLUMN "doseEventId" TEXT;

CREATE UNIQUE INDEX "IntakeLog_doseEventId_key" ON "IntakeLog"("doseEventId");

ALTER TABLE "IntakeLog" ADD CONSTRAINT "IntakeLog_doseEventId_fkey"
  FOREIGN KEY ("doseEventId") REFERENCES "DoseEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
