CREATE MATERIALIZED VIEW IF NOT EXISTS base_monitor_view
(
    `app_id` String,
    `event_type` String,
    `message` String,
    `info` JSON,
    `created_at` DateTime('Asia/Shanghai')
)
ENGINE = MergeTree
ORDER BY (created_at, app_id, event_type)
POPULATE
AS
SELECT *
FROM base_monitor_storage;
