-- Smart alerts for above-average / frequent dosing patterns
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DOSE_PATTERN';
