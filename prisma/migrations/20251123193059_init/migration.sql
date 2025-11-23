-- CreateTable
CREATE TABLE "conversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_amount" BIGINT NOT NULL,
    "source_currency" TEXT NOT NULL,
    "target_amount" BIGINT NOT NULL,
    "target_currency" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "idx_conversion_target_currency" ON "conversion"("target_currency");
