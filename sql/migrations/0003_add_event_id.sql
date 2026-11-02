ALTER TABLE base_monitor_storage
    ADD COLUMN IF NOT EXISTS event_id String DEFAULT '' AFTER app_id;
