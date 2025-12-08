-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "dashboardId" TEXT;

-- CreateIndex
CREATE INDEX "accounts_dashboardId_idx" ON "accounts"("dashboardId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
