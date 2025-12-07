-- CreateEnum
CREATE TYPE "DashboardRole" AS ENUM ('VIEWER', 'EDITOR', 'OWNER');

-- CreateTable
CREATE TABLE "dashboards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_members" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "DashboardRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_invites" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" "DashboardRole" NOT NULL DEFAULT 'VIEWER',
    "expiresAt" TIMESTAMP(3),
    "isOneTime" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "usedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dashboards_ownerId_idx" ON "dashboards"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_members_dashboardId_userId_key" ON "dashboard_members"("dashboardId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_invites_code_key" ON "dashboard_invites"("code");

-- AddForeignKey
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_members" ADD CONSTRAINT "dashboard_members_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_members" ADD CONSTRAINT "dashboard_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_invites" ADD CONSTRAINT "dashboard_invites_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_invites" ADD CONSTRAINT "dashboard_invites_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_invites" ADD CONSTRAINT "dashboard_invites_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
