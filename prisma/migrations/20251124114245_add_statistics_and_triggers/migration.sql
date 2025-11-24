-- Migration: Add statistics table with automatic triggers
-- NOTE: The statistic table uses a singleton row with ID 'singleton'
-- This ID is defined in src/server/config.ts as config.database.statisticSingletonId
-- If you need to change this ID, update both this migration and the config
-- CreateTable
CREATE TABLE "statistic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_conversions" BIGINT NOT NULL,
    "most_converted_currency" TEXT NOT NULL,
    "most_converted_currency_amount" TEXT NOT NULL
);
-- RedefineTables (Migrate BIGINT to TEXT for amounts)
PRAGMA defer_foreign_keys = ON;
PRAGMA foreign_keys = OFF;
CREATE TABLE "new_conversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_amount" TEXT NOT NULL,
    "source_currency" TEXT NOT NULL,
    "target_amount" TEXT NOT NULL,
    "target_currency" TEXT NOT NULL
);
INSERT INTO "new_conversion" (
        "created_at",
        "id",
        "source_amount",
        "source_currency",
        "target_amount",
        "target_currency"
    )
SELECT "created_at",
    "id",
    CAST("source_amount" AS TEXT),
    "source_currency",
    CAST("target_amount" AS TEXT),
    "target_currency"
FROM "conversion";
DROP TABLE "conversion";
ALTER TABLE "new_conversion"
    RENAME TO "conversion";
CREATE INDEX "idx_conversion_target_currency" ON "conversion"("target_currency");
PRAGMA foreign_keys = ON;
PRAGMA defer_foreign_keys = OFF;
-- Initialize statistics with current data
INSERT INTO "statistic" (
        "id",
        "total_conversions",
        "most_converted_currency",
        "most_converted_currency_amount"
    )
SELECT 'singleton',
    COALESCE(
        (
            SELECT COUNT(*)
            FROM "conversion"
        ),
        0
    ),
    COALESCE(
        (
            SELECT "target_currency"
            FROM "conversion"
            GROUP BY "target_currency"
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ), ''
    ), COALESCE(
        (
            SELECT CAST(
                    ROUND(SUM(CAST("target_amount" AS REAL))) AS TEXT
                )
            FROM "conversion"
            WHERE "target_currency" = (
                    SELECT "target_currency"
                    FROM "conversion"
                    GROUP BY "target_currency"
                    ORDER BY COUNT(*) DESC
                    LIMIT 1
                )
        ), '0'
    );
-- Trigger to recalculate statistics after each INSERT
-- This is efficient because we use indexes and only recalculate what's needed
CREATE TRIGGER recalculate_statistics_after_insert
AFTER
INSERT ON "conversion" BEGIN -- Delete old statistic row
DELETE FROM "statistic";
-- Insert new calculated statistics
-- Uses index on target_currency for fast aggregation
INSERT INTO "statistic" (
        "id",
        "total_conversions",
        "most_converted_currency",
        "most_converted_currency_amount"
    )
SELECT 'singleton',
    (
        SELECT COUNT(*)
        FROM "conversion"
    ),
    COALESCE(
        (
            SELECT "target_currency"
            FROM "conversion"
            GROUP BY "target_currency"
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ), ''
    ), COALESCE(
        (
            SELECT CAST(
                    ROUND(SUM(CAST("target_amount" AS REAL))) AS TEXT
                )
            FROM "conversion"
            WHERE "target_currency" = (
                    SELECT "target_currency"
                    FROM "conversion"
                    GROUP BY "target_currency"
                    ORDER BY COUNT(*) DESC
                    LIMIT 1
                )
        ), '0'
    );
END;