-- AlterTable
ALTER TABLE "DeliveryNoteItem" ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "colors" TEXT[];
