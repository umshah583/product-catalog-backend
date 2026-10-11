-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "priceTiers" JSONB NOT NULL DEFAULT '[]';
