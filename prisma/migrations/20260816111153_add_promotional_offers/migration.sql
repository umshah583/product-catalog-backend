-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('BUY_X_GET_Y_FREE', 'PERCENTAGE_DISCOUNT', 'FLAT_DISCOUNT');

-- CreateEnum
CREATE TYPE "ApplicableTo" AS ENUM ('ALL_PRODUCTS', 'SPECIFIC_CATEGORIES', 'SPECIFIC_PRODUCTS');

-- CreateTable
CREATE TABLE "PromotionalOffer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "offerType" "OfferType" NOT NULL,
    "buyQuantity" INTEGER,
    "getQuantity" INTEGER,
    "discountPercent" INTEGER,
    "discountAmount" DECIMAL(10,2),
    "applicableTo" "ApplicableTo" NOT NULL,
    "categoryIds" TEXT[],
    "productIds" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionalOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductToPromotionalOffer" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToPromotionalOffer_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "PromotionalOffer_tenantId_idx" ON "PromotionalOffer"("tenantId");

-- CreateIndex
CREATE INDEX "PromotionalOffer_isActive_idx" ON "PromotionalOffer"("isActive");

-- CreateIndex
CREATE INDEX "PromotionalOffer_startDate_idx" ON "PromotionalOffer"("startDate");

-- CreateIndex
CREATE INDEX "PromotionalOffer_endDate_idx" ON "PromotionalOffer"("endDate");

-- CreateIndex
CREATE INDEX "PromotionalOffer_priority_idx" ON "PromotionalOffer"("priority");

-- CreateIndex
CREATE INDEX "_ProductToPromotionalOffer_B_index" ON "_ProductToPromotionalOffer"("B");

-- AddForeignKey
ALTER TABLE "PromotionalOffer" ADD CONSTRAINT "PromotionalOffer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToPromotionalOffer" ADD CONSTRAINT "_ProductToPromotionalOffer_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToPromotionalOffer" ADD CONSTRAINT "_ProductToPromotionalOffer_B_fkey" FOREIGN KEY ("B") REFERENCES "PromotionalOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
