-- CreateIndex
CREATE INDEX "Appointment_status_date_endTime_idx" ON "Appointment"("status", "date", "endTime");
