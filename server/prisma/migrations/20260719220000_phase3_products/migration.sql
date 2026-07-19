-- Phase 3: Product catalog + barcode lookup

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "dosageForm" TEXT,
    "manufacturer" TEXT,
    "description" TEXT,
    "substanceId" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductBarcode" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "symbology" TEXT NOT NULL DEFAULT 'UPC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductBarcode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductIngredient" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "substanceId" TEXT NOT NULL,
    "strengthValue" DOUBLE PRECISION,
    "strengthUnit" TEXT,

    CONSTRAINT "ProductIngredient_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Product_name_idx" ON "Product"("name");

CREATE INDEX "Product_substanceId_idx" ON "Product"("substanceId");

CREATE INDEX "Product_externalId_idx" ON "Product"("externalId");

CREATE UNIQUE INDEX "ProductBarcode_code_key" ON "ProductBarcode"("code");

CREATE INDEX "ProductBarcode_productId_idx" ON "ProductBarcode"("productId");

CREATE INDEX "ProductIngredient_productId_idx" ON "ProductIngredient"("productId");

CREATE INDEX "ProductIngredient_substanceId_idx" ON "ProductIngredient"("substanceId");

CREATE UNIQUE INDEX "ProductIngredient_productId_substanceId_key" ON "ProductIngredient"("productId", "substanceId");

ALTER TABLE "Product" ADD CONSTRAINT "Product_substanceId_fkey" FOREIGN KEY ("substanceId") REFERENCES "Substance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductIngredient" ADD CONSTRAINT "ProductIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductIngredient" ADD CONSTRAINT "ProductIngredient_substanceId_fkey" FOREIGN KEY ("substanceId") REFERENCES "Substance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
