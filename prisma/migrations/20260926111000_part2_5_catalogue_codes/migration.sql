-- AlterTable
ALTER TABLE "products" ADD COLUMN     "catalogueCode" TEXT,
ADD COLUMN     "collectionCode" TEXT,
ADD COLUMN     "designNumber" INTEGER,
ADD COLUMN     "isSeasonal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mainCategory" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "products_catalogueCode_key" ON "products"("catalogueCode");

-- CreateIndex
CREATE INDEX "products_mainCategory_idx" ON "products"("mainCategory");

-- CreateIndex
CREATE INDEX "products_collectionCode_idx" ON "products"("collectionCode");

-- CreateIndex
CREATE INDEX "products_catalogueCode_idx" ON "products"("catalogueCode");

-- CreateIndex
CREATE UNIQUE INDEX "products_collectionCode_designNumber_key" ON "products"("collectionCode", "designNumber");
