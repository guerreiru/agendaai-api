/*
  Warnings:

  - Added the required column `createdByRole` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdByUserId` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AppointmentStatus" ADD VALUE 'PENDING_CLIENT_CONFIRMATION';
ALTER TYPE "AppointmentStatus" ADD VALUE 'PENDING_PROFESSIONAL_CONFIRMATION';
ALTER TYPE "AppointmentStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "createdByRole" "UserRole" NOT NULL,
ADD COLUMN     "createdByUserId" TEXT NOT NULL,
ADD COLUMN     "pendingApprovalFrom" "UserRole",
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedByUserId" TEXT,
ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "autoConfirm" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Appointment_pendingApprovalFrom_idx" ON "Appointment"("pendingApprovalFrom");
