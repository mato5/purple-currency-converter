-- CreateTable
CREATE TABLE "conversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_amount" INTEGER NOT NULL,
    "source_currency" TEXT NOT NULL,
    "target_amount" INTEGER NOT NULL,
    "target_currency" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "statistic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "total_conversions" INTEGER NOT NULL,
    "most_converted_currency" TEXT NOT NULL,
    "most_converted_currency_amount" INTEGER NOT NULL
);
