-- CreateEnum
CREATE TYPE "CreditAppStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CreditApplication" (
    "id" TEXT NOT NULL,
    "appNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "customerTrn" TEXT,
    "status" "CreditAppStatus" NOT NULL DEFAULT 'DRAFT',
    "formData" JSONB NOT NULL,
    "signatureData" TEXT,
    "stampData" TEXT,
    "initials" TEXT,
    "pdfKey" TEXT,
    "internalNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditAppDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "received" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditAppDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditAppAudit" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditAppAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditApplication_tenantId_idx" ON "CreditApplication"("tenantId");

-- CreateIndex
CREATE INDEX "CreditApplication_status_idx" ON "CreditApplication"("status");

-- CreateIndex
CREATE INDEX "CreditApplication_createdAt_idx" ON "CreditApplication"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditApplication_tenantId_appNumber_key" ON "CreditApplication"("tenantId", "appNumber");

-- CreateIndex
CREATE INDEX "CreditAppDocument_applicationId_idx" ON "CreditAppDocument"("applicationId");

-- CreateIndex
CREATE INDEX "CreditAppAudit_applicationId_idx" ON "CreditAppAudit"("applicationId");

-- AddForeignKey
ALTER TABLE "CreditApplication" ADD CONSTRAINT "CreditApplication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditAppDocument" ADD CONSTRAINT "CreditAppDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CreditApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditAppAudit" ADD CONSTRAINT "CreditAppAudit_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CreditApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
