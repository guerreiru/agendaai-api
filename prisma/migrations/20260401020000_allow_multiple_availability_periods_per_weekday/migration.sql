-- Drop unique index that blocked multiple periods on the same weekday
DROP INDEX IF EXISTS "Availability_professionalId_weekday_key";

-- Prevent exact duplicate periods while allowing multiple non-overlapping periods
CREATE UNIQUE INDEX "Availability_professionalId_weekday_startTime_endTime_key"
ON "Availability"("professionalId", "weekday", "startTime", "endTime");

-- Speed up weekday lookups for slot generation and appointment validation
CREATE INDEX "Availability_professionalId_weekday_idx"
ON "Availability"("professionalId", "weekday");
