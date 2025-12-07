-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "entryType" TEXT NOT NULL,
    "flowType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "institution" TEXT,
    "cardBrand" TEXT,
    "installmentTotal" INTEGER NOT NULL DEFAULT 0,
    "installmentNumber" INTEGER NOT NULL DEFAULT 0,
    "installmentStatus" TEXT NOT NULL DEFAULT 'N/A',
    "notes" TEXT,
    "isTemporary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- CreateIndex
CREATE INDEX "transactions_entryType_idx" ON "transactions"("entryType");

-- CreateIndex
CREATE INDEX "transactions_category_idx" ON "transactions"("category");

-- CreateIndex
CREATE INDEX "transactions_institution_idx" ON "transactions"("institution");
