-- CreateEnum
CREATE TYPE "WorkFolderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'READY_FOR_BILLING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StudyStatus" AS ENUM ('AWP_AVAILABLE', 'WAITING_FOR_PDF_P', 'PDF_P_RECEIVED', 'MEDICAL_REPORT_GENERATED', 'FINAL_PDF_GENERATED', 'COMPLETED', 'ERROR');

-- CreateTable
CREATE TABLE "WorkFolder" (
    "id" TEXT NOT NULL,
    "driveFolderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "institutionId" TEXT,
    "status" "WorkFolderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Study" (
    "id" TEXT NOT NULL,
    "workFolderId" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "fileBaseName" TEXT NOT NULL,
    "awpFileName" TEXT NOT NULL,
    "awpDriveFileId" TEXT,
    "pdfPFileName" TEXT,
    "pdfPDriveFileId" TEXT,
    "medicalReportName" TEXT,
    "medicalReportDriveId" TEXT,
    "finalPdfName" TEXT,
    "finalPdfDriveId" TEXT,
    "status" "StudyStatus" NOT NULL DEFAULT 'AWP_AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Study_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkFolder_driveFolderId_key" ON "WorkFolder"("driveFolderId");

-- CreateIndex
CREATE INDEX "WorkFolder_institutionId_idx" ON "WorkFolder"("institutionId");

-- CreateIndex
CREATE INDEX "WorkFolder_workDate_idx" ON "WorkFolder"("workDate");

-- CreateIndex
CREATE INDEX "WorkFolder_status_idx" ON "WorkFolder"("status");

-- CreateIndex
CREATE INDEX "Study_status_idx" ON "Study"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Study_workFolderId_fileBaseName_key" ON "Study"("workFolderId", "fileBaseName");

-- AddForeignKey
ALTER TABLE "WorkFolder" ADD CONSTRAINT "WorkFolder_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Study" ADD CONSTRAINT "Study_workFolderId_fkey" FOREIGN KEY ("workFolderId") REFERENCES "WorkFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
