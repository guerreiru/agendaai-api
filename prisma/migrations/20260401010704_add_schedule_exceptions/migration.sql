-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('BLOCK', 'BREAK');

-- CreateTable
CREATE TABLE "ScheduleException" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "type" "ExceptionType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleException_professionalId_idx" ON "ScheduleException"("professionalId");

-- CreateIndex
CREATE INDEX "ScheduleException_startDate_idx" ON "ScheduleException"("startDate");

-- CreateIndex
CREATE INDEX "ScheduleException_endDate_idx" ON "ScheduleException"("endDate");

-- AddForeignKey
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
