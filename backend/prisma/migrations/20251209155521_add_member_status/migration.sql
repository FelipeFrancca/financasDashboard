-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterTable
ALTER TABLE "dashboard_members" ADD COLUMN     "status" "MemberStatus" NOT NULL DEFAULT 'APPROVED';

-- CreateIndex
CREATE INDEX "dashboard_members_status_idx" ON "dashboard_members"("status");
