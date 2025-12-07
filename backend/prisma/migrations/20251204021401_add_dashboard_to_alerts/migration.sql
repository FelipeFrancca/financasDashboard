/*
  Warnings:

  - Added the required column `dashboardId` to the `alerts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dashboardId` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AlertSeverity" ADD VALUE 'ERROR';
ALTER TYPE "AlertSeverity" ADD VALUE 'SUCCESS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AlertType" ADD VALUE 'BUDGET_ALERT';
ALTER TYPE "AlertType" ADD VALUE 'GOAL_MILESTONE';
ALTER TYPE "AlertType" ADD VALUE 'LARGE_TRANSACTION';
ALTER TYPE "AlertType" ADD VALUE 'DASHBOARD_INVITE';
ALTER TYPE "AlertType" ADD VALUE 'SYSTEM_UPDATE';
ALTER TYPE "AlertType" ADD VALUE 'PAYMENT_DUE';
ALTER TYPE "AlertType" ADD VALUE 'RECURRING_TRANSACTION';

-- AlterTable
ALTER TABLE "alerts" ADD COLUMN     "dashboardId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "dashboardId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "alerts_dashboardId_idx" ON "alerts"("dashboardId");

-- CreateIndex
CREATE INDEX "alerts_userId_idx" ON "alerts"("userId");

-- CreateIndex
CREATE INDEX "alerts_isRead_idx" ON "alerts"("isRead");

-- CreateIndex
CREATE INDEX "transactions_dashboardId_idx" ON "transactions"("dashboardId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
