-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "costCenter" TEXT;

-- CreateIndex (optional, for better query performance)
CREATE INDEX IF NOT EXISTS "transactions_costCenter_idx" ON "transactions"("costCenter");
