-- ============================================================================
-- Script: Populate Large Dataset for Late Materialization Demo
-- ============================================================================
-- This script populates the demo_events table with 2 million rows to
-- demonstrate the dramatic performance benefits of late materialization.
--
-- Expected execution time: 60-90 seconds
-- ============================================================================

-- First, clear any existing data
TRUNCATE TABLE demo_events;

-- Insert 2 million rows with realistic, wide data
-- This uses GENERATE_SERIES to create rows efficiently
INSERT INTO demo_events
SELECT
    ROW_NUMBER() OVER () AS event_id,
    NOW() - INTERVAL '1 second' * (ROW_NUMBER() OVER ()) AS event_timestamp,
    ABS(HASH(ROW_NUMBER() OVER ())) % 100000 AS user_id,
    MD5(ROW_NUMBER()::TEXT || '_session') AS session_id,
    CASE (ABS(HASH(ROW_NUMBER() OVER ())) % 5)
        WHEN 0 THEN 'page_view'
        WHEN 1 THEN 'add_to_cart'
        WHEN 2 THEN 'purchase'
        WHEN 3 THEN 'login'
        ELSE 'logout'
    END AS event_type,
    'event_' || ROW_NUMBER()::TEXT AS event_name,
    'category_' || (ABS(HASH(ROW_NUMBER() OVER ())) % 100)::TEXT AS event_category,
    (ABS(HASH(ROW_NUMBER() OVER ())) % 1000) / 100.0 AS event_value,
    'https://example.com/page/' || (ABS(HASH(ROW_NUMBER() OVER ())) % 1000)::TEXT AS page_url,
    'Page ' || (ABS(HASH(ROW_NUMBER() OVER ())) % 1000)::TEXT AS page_title,
    'https://example.com/referrer/' || (ABS(HASH(ROW_NUMBER() OVER ())) % 500)::TEXT AS referrer_url,
    'utm_source_' || (ABS(HASH(ROW_NUMBER() OVER ())) % 50)::TEXT AS utm_source,
    'utm_medium_' || (ABS(HASH(ROW_NUMBER() OVER ())) % 10)::TEXT AS utm_medium,
    'utm_campaign_' || (ABS(HASH(ROW_NUMBER() OVER ())) % 20)::TEXT AS utm_campaign,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' AS user_agent,
    '192.168.' || (ABS(HASH(ROW_NUMBER() OVER ())) % 256)::TEXT || '.' || (ABS(HASH(ROW_NUMBER() OVER () + 1)) % 256)::TEXT AS ip_address,
    CASE (ABS(HASH(ROW_NUMBER() OVER ())) % 3) WHEN 0 THEN 'US' WHEN 1 THEN 'CA' ELSE 'GB' END AS country,
    'Region ' || (ABS(HASH(ROW_NUMBER() OVER ())) % 50)::TEXT AS region,
    'City ' || (ABS(HASH(ROW_NUMBER() OVER ())) % 100)::TEXT AS city,
    CASE (ABS(HASH(ROW_NUMBER() OVER ())) % 2) WHEN 0 THEN 'Desktop' ELSE 'Mobile' END AS device_type,
    'Chrome' AS browser,
    '120.0.0' AS browser_version,
    CASE (ABS(HASH(ROW_NUMBER() OVER ())) % 3) WHEN 0 THEN 'Windows' WHEN 1 THEN 'macOS' ELSE 'Linux' END AS os,
    '10.0' AS os_version,
    '1920x1080' AS screen_resolution,
    '1920x969' AS viewport_size,
    -- Large HTML content column (demonstrates CONDITION 1: Large Column Size)
    '<!DOCTYPE html><html><body>Page content here with lots of text to make this column large. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</body></html>' AS page_html,
    -- Large JSON columns (demonstrates CONDITION 1: Large Column Size)
    '{"accept": "text/html", "accept-encoding": "gzip, deflate", "user-agent": "Mozilla/5.0..."}' AS request_headers,
    '{"content-type": "text/html", "cache-control": "max-age=3600", "server": "nginx"}' AS response_headers,
    '{"session_id": "abc123", "user_prefs": {"theme": "dark"}, "cart_items": []}' AS cookies,
    '{"recent_searches": ["product A", "product B"], "viewed_items": [1, 2, 3]}' AS local_storage,
    '{"temp_data": "some value", "form_state": {"field1": "value1"}}' AS session_storage,
    -- Very large debug column (key for late materialization benefit)
    'DEBUG: Function called at line 42 with parameters. Stack trace includes multiple function calls and variable states for detailed debugging purposes.' AS debug_trace,
    'Error: TypeError at Object.<anonymous> (/app/index.js:42:5)...' AS error_stack,
    '{"page_load": 1234, "dom_ready": 890, "first_paint": 456}' AS performance_metrics,
    '{"custom_field_1": "value1", "custom_field_2": 123, "nested": {"data": "here"}}' AS custom_data,
    'exp_' || (ABS(HASH(ROW_NUMBER() OVER ())) % 100)::TEXT AS experiment_id,
    CASE (ABS(HASH(ROW_NUMBER() OVER ())) % 2) WHEN 0 THEN 'control' ELSE 'treatment' END AS experiment_variant,
    'group_' || (ABS(HASH(ROW_NUMBER() OVER ())) % 10)::TEXT AS ab_test_group,
    CASE (ABS(HASH(ROW_NUMBER() OVER ())) % 3) WHEN 0 THEN 'new_users' WHEN 1 THEN 'returning_users' ELSE 'power_users' END AS user_segment,
    CASE (ABS(HASH(ROW_NUMBER() OVER ())) % 4) WHEN 0 THEN 'free' WHEN 1 THEN 'basic' WHEN 2 THEN 'pro' ELSE 'enterprise' END AS customer_tier
FROM GENERATE_SERIES(1, 2000000) AS s(i);

-- Verify the data was inserted
SELECT 
    COUNT(*) as total_rows,
    MIN(event_timestamp) as earliest_event,
    MAX(event_timestamp) as latest_event,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT event_type) as event_types
FROM demo_events;

-- Show table size
SELECT 
    table_name,
    number_of_rows,
    ROUND(compressed_bytes / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables
WHERE table_name = 'demo_events';

