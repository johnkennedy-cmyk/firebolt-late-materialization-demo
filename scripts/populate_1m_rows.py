#!/usr/bin/env python3
"""
Standalone script to populate demo_events table with 2 million rows
Run this directly: python3 populate_1m_rows.py

Required environment variables:
- FIREBOLT_CLIENT_ID
- FIREBOLT_CLIENT_SECRET
- FIREBOLT_ACCOUNT_NAME (optional, defaults to 'se-demo-account')
- FIREBOLT_ENGINE (optional, defaults to 'ecommerceengine')
"""

import os
import sys
from firebolt.client import DEFAULT_API_URL
from firebolt.client.auth import ClientCredentials
from firebolt.db import connect

# Load credentials from environment variables
CLIENT_ID = os.environ.get("FIREBOLT_CLIENT_ID")
CLIENT_SECRET = os.environ.get("FIREBOLT_CLIENT_SECRET")
ACCOUNT_NAME = os.environ.get("FIREBOLT_ACCOUNT_NAME", "se-demo-account")
DATABASE_NAME = "late_materialization_demo"
ENGINE_NAME = os.environ.get("FIREBOLT_ENGINE", "ecommerceengine")

# Validate required environment variables
if not CLIENT_ID or not CLIENT_SECRET:
    print("ERROR: Missing required environment variables!")
    print("Please set:")
    print("  export FIREBOLT_CLIENT_ID=your_client_id")
    print("  export FIREBOLT_CLIENT_SECRET=your_client_secret")
    print("  export FIREBOLT_ACCOUNT_NAME=your_account_name  # Optional")
    print("  export FIREBOLT_ENGINE=your_engine_name  # Optional")
    sys.exit(1)

print("=" * 80)
print("Populating demo_events with 2 million rows")
print("=" * 80)
print(f"Database: {DATABASE_NAME}")
print(f"Engine: {ENGINE_NAME}")
print("=" * 80)

try:
    print("\n[1/4] Connecting to Firebolt...")
    auth = ClientCredentials(CLIENT_ID, CLIENT_SECRET)
    connection = connect(
        auth=auth,
        account_name=ACCOUNT_NAME,
        database=DATABASE_NAME,
        engine_name=ENGINE_NAME,
        api_endpoint=DEFAULT_API_URL
    )
    cursor = connection.cursor()
    print("✓ Connected successfully")

    print("\n[2/4] Inserting 2 million rows (this will take 60-90 seconds)...")
    # Use a simpler approach with explicit column references to avoid window function issues
    insert_query = """
INSERT INTO demo_events
WITH numbered_rows AS (
    SELECT 
        i AS row_num
    FROM GENERATE_SERIES(1, 2000000) AS s(i)
)
SELECT
    row_num AS event_id,
    NOW() - INTERVAL '1 second' * row_num AS event_timestamp,
    ABS(HASH(row_num)) % 100000 AS user_id,
    MD5(row_num::TEXT || '_session') AS session_id,
    CASE (ABS(HASH(row_num)) % 5)
        WHEN 0 THEN 'page_view'
        WHEN 1 THEN 'add_to_cart'
        WHEN 2 THEN 'purchase'
        WHEN 3 THEN 'login'
        ELSE 'logout'
    END AS event_type,
    'event_' || row_num::TEXT AS event_name,
    'category_' || (ABS(HASH(row_num)) % 100)::TEXT AS event_category,
    (ABS(HASH(row_num)) % 1000) / 100.0 AS event_value,
    'https://example.com/page/' || (ABS(HASH(row_num)) % 1000)::TEXT AS page_url,
    'Page ' || (ABS(HASH(row_num)) % 1000)::TEXT AS page_title,
    'https://example.com/referrer/' || (ABS(HASH(row_num)) % 500)::TEXT AS referrer_url,
    'utm_source_' || (ABS(HASH(row_num)) % 50)::TEXT AS utm_source,
    'utm_medium_' || (ABS(HASH(row_num)) % 10)::TEXT AS utm_medium,
    'utm_campaign_' || (ABS(HASH(row_num)) % 20)::TEXT AS utm_campaign,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' AS user_agent,
    '192.168.' || (ABS(HASH(row_num)) % 256)::TEXT || '.' || (ABS(HASH(row_num + 1)) % 256)::TEXT AS ip_address,
    CASE (ABS(HASH(row_num)) % 3) WHEN 0 THEN 'US' WHEN 1 THEN 'CA' ELSE 'GB' END AS country,
    'Region ' || (ABS(HASH(row_num)) % 50)::TEXT AS region,
    'City ' || (ABS(HASH(row_num)) % 100)::TEXT AS city,
    CASE (ABS(HASH(row_num)) % 2) WHEN 0 THEN 'Desktop' ELSE 'Mobile' END AS device_type,
    'Chrome' AS browser,
    '120.0.0' AS browser_version,
    CASE (ABS(HASH(row_num)) % 3) WHEN 0 THEN 'Windows' WHEN 1 THEN 'macOS' ELSE 'Linux' END AS os,
    '10.0' AS os_version,
    '1920x1080' AS screen_resolution,
    '1920x969' AS viewport_size,
    '<!DOCTYPE html><html><body>Page content here with lots of text to make this column large. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</body></html>' AS page_html,
    '{"accept": "text/html", "accept-encoding": "gzip, deflate", "user-agent": "Mozilla/5.0..."}' AS request_headers,
    '{"content-type": "text/html", "cache-control": "max-age=3600", "server": "nginx"}' AS response_headers,
    '{"session_id": "abc123", "user_prefs": {"theme": "dark"}, "cart_items": []}' AS cookies,
    '{"recent_searches": ["product A", "product B"], "viewed_items": [1, 2, 3]}' AS local_storage,
    '{"temp_data": "some value", "form_state": {"field1": "value1"}}' AS session_storage,
    'DEBUG: Function called at line 42 with parameters. Stack trace includes multiple function calls and variable states for detailed debugging purposes.' AS debug_trace,
    'Error: TypeError at Object.<anonymous> (/app/index.js:42:5)...' AS error_stack,
    '{"page_load": 1234, "dom_ready": 890, "first_paint": 456}' AS performance_metrics,
    '{"custom_field_1": "value1", "custom_field_2": 123, "nested": {"data": "here"}}' AS custom_data,
    'exp_' || (ABS(HASH(row_num)) % 100)::TEXT AS experiment_id,
    CASE (ABS(HASH(row_num)) % 2) WHEN 0 THEN 'control' ELSE 'treatment' END AS experiment_variant,
    'group_' || (ABS(HASH(row_num)) % 10)::TEXT AS ab_test_group,
    CASE (ABS(HASH(row_num)) % 3) WHEN 0 THEN 'new_users' WHEN 1 THEN 'returning_users' ELSE 'power_users' END AS user_segment,
    CASE (ABS(HASH(row_num)) % 4) WHEN 0 THEN 'free' WHEN 1 THEN 'basic' WHEN 2 THEN 'pro' ELSE 'enterprise' END AS customer_tier
FROM numbered_rows
    """
    
    cursor.execute(insert_query)
    print("✓ Successfully inserted 2 million rows!")

    print("\n[3/4] Verifying data...")
    cursor.execute("SELECT COUNT(*) FROM demo_events")
    row_count = cursor.fetchone()[0]
    print(f"✓ Total rows in demo_events: {row_count:,}")

    print("\n[4/4] Checking table size...")
    cursor.execute("""
        SELECT 
            table_name,
            number_of_rows,
            ROUND(compressed_bytes / 1024 / 1024, 2) AS size_mb
        FROM information_schema.tables
        WHERE table_name = 'demo_events'
    """)
    table_info = cursor.fetchone()
    if table_info:
        table_name, rows, size_mb = table_info
        print(f"✓ Table: {table_name}")
        print(f"✓ Rows: {rows:,}")
        print(f"✓ Size: {size_mb} MB")

    print("\n" + "=" * 80)
    print("✓ SUCCESS! The table is now ready for late materialization testing!")
    print("=" * 80)
    print("\nYou should now see dramatic performance improvements when running:")
    print("  • SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 10")
    print("\nExpected: 5-10x faster with late materialization enabled!")

except Exception as e:
    print(f"\n✗ Error: {e}")
    print("\n" + "=" * 80)
    print("✗ FAILED")
    print("=" * 80)
    exit(1)

