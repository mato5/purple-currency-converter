-- SQLite triggers to keep statistics up-to-date automatically
-- This is the most performant approach as it happens at the database level
-- Trigger to update statistics after INSERT
CREATE TRIGGER update_statistics_after_insert
AFTER
INSERT ON conversion BEGIN -- First, ensure we have a statistics record (create if not exists)
INSERT
    OR IGNORE INTO statistic (
        id,
        created_at,
        updated_at,
        total_conversions,
        most_converted_currency,
        most_converted_currency_amount
    )
VALUES (
        'default',
        datetime('now'),
        datetime('now'),
        0,
        '',
        0
    );
-- Update the statistics with aggregated data
UPDATE statistic
SET updated_at = datetime('now'),
    total_conversions = (
        SELECT COUNT(*)
        FROM conversion
    ),
    most_converted_currency = (
        SELECT target_currency
        FROM conversion
        GROUP BY target_currency
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ), most_converted_currency_amount = (
        SELECT SUM(target_amount)
        FROM conversion
        GROUP BY target_currency
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
WHERE id = 'default';
END;
-- Trigger to update statistics after DELETE
CREATE TRIGGER update_statistics_after_delete
AFTER DELETE ON conversion BEGIN -- Update the statistics with aggregated data
UPDATE statistic
SET updated_at = datetime('now'),
    total_conversions = (
        SELECT COUNT(*)
        FROM conversion
    ),
    most_converted_currency = COALESCE(
        (
            SELECT target_currency
            FROM conversion
            GROUP BY target_currency
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ), ''
    ), most_converted_currency_amount = COALESCE(
        (
            SELECT SUM(target_amount)
            FROM conversion
            GROUP BY target_currency
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ), 0
    )
WHERE id = 'default';
END;