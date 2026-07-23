-- Expand inbox notification types for dose / refill / family events
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DOSE_MISSED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REFILL_DUE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LOW_STOCK';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FAMILY';
