CREATE TABLE "FinancialYear" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinancialYear_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FinancialYear_label_key" ON "FinancialYear"("label");
CREATE INDEX "FinancialYear_isCurrent_idx" ON "FinancialYear"("isCurrent");
CREATE INDEX "FinancialYear_startDate_idx" ON "FinancialYear"("startDate");
CREATE INDEX "FinancialYear_endDate_idx" ON "FinancialYear"("endDate");

