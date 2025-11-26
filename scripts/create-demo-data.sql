-- Firebolt Late Materialization Demo - Sample Data Table
-- This script creates a wide table optimized for demonstrating late materialization benefits

-- Create the demo_events table with many columns
CREATE TABLE IF NOT EXISTS demo_events (
  -- Core identifiers
  event_id BIGINT,
  timestamp TIMESTAMP,
  user_id BIGINT,
  session_id TEXT,
  
  -- Event details
  event_type TEXT,
  event_name TEXT,
  event_category TEXT,
  event_value DOUBLE PRECISION,
  
  -- Page/URL information
  page_url TEXT,
  page_title TEXT,
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- User/Device information
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  screen_resolution TEXT,
  viewport_size TEXT,
  
  -- Large payload columns (these maximize late materialization benefit)
  page_html TEXT,              -- Full HTML content
  request_headers TEXT,        -- JSON string of all request headers
  response_headers TEXT,       -- JSON string of all response headers
  cookies TEXT,                -- JSON string of cookie data
  local_storage TEXT,          -- JSON string of local storage
  session_storage TEXT,        -- JSON string of session storage
  debug_trace TEXT,            -- Detailed debug information
  error_stack TEXT,            -- Stack trace if error occurred
  performance_metrics TEXT,    -- JSON string of performance metrics
  custom_data TEXT,            -- JSON string of custom event properties
  
  -- Additional metadata
  experiment_id TEXT,
  experiment_variant TEXT,
  ab_test_group TEXT,
  user_segment TEXT,
  customer_tier TEXT
) PRIMARY INDEX event_id;

-- Example: Insert some sample data (adapt to your data source)
-- Note: For best demonstration, you want millions of rows with large text fields

-- Option 1: Load from S3 (replace with your bucket/credentials)
/*
COPY INTO demo_events 
FROM 's3://your-bucket/events/2024/'
WITH CREDENTIALS = (
  AWS_KEY_ID = 'your-aws-key'
  AWS_SECRET_KEY = 'your-aws-secret'
)
FILE_FORMAT = (TYPE = PARQUET);
*/

-- Option 2: Generate synthetic data using SQL
-- This creates a small sample dataset for testing

-- Insert 100 sample rows
INSERT INTO demo_events 
SELECT
  row_number() OVER () as event_id,
  CURRENT_TIMESTAMP - INTERVAL '1 day' * (random() * 30) as timestamp,
  CAST(random() * 10000 as BIGINT) as user_id,
  'session_' || CAST(random() * 5000 as TEXT) as session_id,
  
  CASE CAST(random() * 5 as INT)
    WHEN 0 THEN 'page_view'
    WHEN 1 THEN 'click'
    WHEN 2 THEN 'form_submit'
    WHEN 3 THEN 'purchase'
    ELSE 'custom'
  END as event_type,
  
  'event_' || CAST(random() * 100 as TEXT) as event_name,
  'category_' || CAST(random() * 10 as TEXT) as event_category,
  random() * 1000 as event_value,
  
  'https://example.com/page/' || CAST(random() * 1000 as TEXT) as page_url,
  'Page ' || CAST(random() * 1000 as TEXT) as page_title,
  'https://example.com/referrer/' || CAST(random() * 500 as TEXT) as referrer_url,
  'utm_source_' || CAST(random() * 5 as TEXT) as utm_source,
  'utm_medium_' || CAST(random() * 3 as TEXT) as utm_medium,
  'utm_campaign_' || CAST(random() * 10 as TEXT) as utm_campaign,
  
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' as user_agent,
  '192.168.' || CAST(random() * 255 as TEXT) || '.' || CAST(random() * 255 as TEXT) as ip_address,
  
  CASE CAST(random() * 5 as INT)
    WHEN 0 THEN 'US'
    WHEN 1 THEN 'UK'
    WHEN 2 THEN 'DE'
    WHEN 3 THEN 'FR'
    ELSE 'CA'
  END as country,
  
  'Region ' || CAST(random() * 10 as TEXT) as region,
  'City ' || CAST(random() * 50 as TEXT) as city,
  
  CASE CAST(random() * 3 as INT)
    WHEN 0 THEN 'Desktop'
    WHEN 1 THEN 'Mobile'
    ELSE 'Tablet'
  END as device_type,
  
  CASE CAST(random() * 3 as INT)
    WHEN 0 THEN 'Chrome'
    WHEN 1 THEN 'Firefox'
    ELSE 'Safari'
  END as browser,
  
  '120.0.0' as browser_version,
  
  CASE CAST(random() * 3 as INT)
    WHEN 0 THEN 'Windows'
    WHEN 1 THEN 'MacOS'
    ELSE 'Linux'
  END as os,
  
  '10.0' as os_version,
  '1920x1080' as screen_resolution,
  '1920x969' as viewport_size,
  
  -- Large text fields (these are where late materialization shines)
  repeat('<!DOCTYPE html><html><body>Page content here...</body></html>', 100) as page_html,
  '{"accept": "text/html", "accept-encoding": "gzip, deflate", "user-agent": "Mozilla/5.0..."}' as request_headers,
  '{"content-type": "text/html", "cache-control": "max-age=3600", "server": "nginx"}' as response_headers,
  '{"session_id": "abc123", "user_prefs": {"theme": "dark"}, "cart_items": []}' as cookies,
  '{"recent_searches": ["product A", "product B"], "viewed_items": [1, 2, 3]}' as local_storage,
  '{"temp_data": "some value", "form_state": {"field1": "value1"}}' as session_storage,
  repeat('DEBUG: Function called at line 42... ', 50) as debug_trace,
  'Error: TypeError at Object.<anonymous> (/app/index.js:42:5)...' as error_stack,
  '{"page_load": 1234, "dom_ready": 890, "first_paint": 456}' as performance_metrics,
  '{"custom_field_1": "value1", "custom_field_2": 123, "nested": {"data": "here"}}' as custom_data,
  
  'exp_' || CAST(random() * 10 as TEXT) as experiment_id,
  CASE CAST(random() * 2 as INT) WHEN 0 THEN 'control' ELSE 'variant' END as experiment_variant,
  'group_' || CAST(random() * 4 as TEXT) as ab_test_group,
  CASE CAST(random() * 3 as INT)
    WHEN 0 THEN 'new_users'
    WHEN 1 THEN 'returning_users'
    ELSE 'power_users'
  END as user_segment,
  CASE CAST(random() * 3 as INT)
    WHEN 0 THEN 'free'
    WHEN 1 THEN 'premium'
    ELSE 'enterprise'
  END as customer_tier
FROM generate_series(1, 100);

-- For API logs example (from the blog post)
CREATE TABLE IF NOT EXISTS api_logs (
  log_id BIGINT,
  timestamp TIMESTAMP,
  endpoint TEXT,
  method TEXT,
  status_code INT,
  response_time DOUBLE PRECISION,
  request_body TEXT,
  response_body TEXT,
  debug_trace TEXT,
  error_message TEXT,
  user_id BIGINT,
  api_key_hash TEXT
) PRIMARY INDEX log_id;

-- Insert sample API logs
INSERT INTO api_logs
SELECT
  row_number() OVER () as log_id,
  CURRENT_TIMESTAMP - INTERVAL '1 hour' * (random() * 24) as timestamp,
  '/api/v1/endpoint/' || CAST(random() * 50 as TEXT) as endpoint,
  CASE CAST(random() * 4 as INT)
    WHEN 0 THEN 'GET'
    WHEN 1 THEN 'POST'
    WHEN 2 THEN 'PUT'
    ELSE 'DELETE'
  END as method,
  CASE 
    WHEN random() < 0.9 THEN 200
    WHEN random() < 0.95 THEN 404
    ELSE 500
  END as status_code,
  random() * 5000 as response_time,  -- milliseconds
  '{"param1": "value1", "param2": "value2"}' as request_body,
  '{"result": "success", "data": [...]}' as response_body,
  repeat('TRACE: Processing request... ', 100) as debug_trace,
  CASE WHEN random() < 0.1 THEN 'Error: Timeout' ELSE NULL END as error_message,
  CAST(random() * 10000 as BIGINT) as user_id,
  'key_' || CAST(random() * 100 as TEXT) as api_key_hash
FROM generate_series(1, 1000);

-- Verify the data
SELECT COUNT(*) as event_count FROM demo_events;
SELECT COUNT(*) as log_count FROM api_logs;

-- Test a late materialization query
SELECT * FROM demo_events ORDER BY timestamp DESC LIMIT 10;

-- Compare with a non-optimized query (uncomment to test, but may be slow)
-- SELECT * FROM demo_events ORDER BY timestamp DESC LIMIT 100;

