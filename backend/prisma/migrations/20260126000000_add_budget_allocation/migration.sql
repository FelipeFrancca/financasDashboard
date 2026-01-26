-- CreateTable
CREATE TABLE "budget_allocation_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "dashboardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_allocation_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_allocations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "linkedCategories" TEXT[],
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budget_allocation_profiles_userId_isDefault_idx" ON "budget_allocation_profiles"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "budget_allocation_profiles_dashboardId_idx" ON "budget_allocation_profiles"("dashboardId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_allocation_profiles_userId_name_key" ON "budget_allocation_profiles"("userId", "name");

-- CreateIndex
CREATE INDEX "budget_allocations_profileId_idx" ON "budget_allocations"("profileId");

-- AddForeignKey
ALTER TABLE "budget_allocation_profiles" ADD CONSTRAINT "budget_allocation_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocation_profiles" ADD CONSTRAINT "budget_allocation_profiles_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "budget_allocation_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
