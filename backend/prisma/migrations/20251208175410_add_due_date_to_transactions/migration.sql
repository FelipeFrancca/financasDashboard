/*
  Warnings:

  - Added the required column `dashboardId` to the `recurring_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "closingDay" INTEGER,
ADD COLUMN     "dueDay" INTEGER;

-- AlterTable
ALTER TABLE "recurring_transactions" ADD COLUMN     "dashboardId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "installmentGroupId" TEXT;

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "recurring_transactions_dashboardId_idx" ON "recurring_transactions"("dashboardId");

-- CreateIndex
CREATE INDEX "transactions_installmentGroupId_idx" ON "transactions"("installmentGroupId");

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
