CREATE TABLE IF NOT EXISTS base_monitor_storage
(
    `app_id` String,
    `event_type` String,
    `message` String,
    `info` JSON,
    `created_at` DateTime('Asia/Shanghai') DEFAULT now('Asia/Shanghai')
)
ENGINE = MergeTree
ORDER BY tuple();
