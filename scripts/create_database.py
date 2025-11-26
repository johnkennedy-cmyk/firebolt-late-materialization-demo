#!/usr/bin/env python3
"""
Create the late_materialization_demo database in Firebolt Cloud.
This script creates the database and sample tables for the demo.
"""

import os
from firebolt.client import DEFAULT_API_URL
from firebolt.db import connect

# Credentials (you should set these as environment variables)
CLIENT_ID = os.getenv("FIREBOLT_CLIENT_ID", "REDACTED_CLIENT_ID")
CLIENT_SECRET = os.getenv("FIREBOLT_CLIENT_SECRET", "REDACTED_CLIENT_SECRET")
ACCOUNT_NAME = "se-demo-account"
ENGINE_NAME = "ecommerceengine"
DATABASE_NAME = "late_materialization_demo"

print("=" * 80)
print("Firebolt Late Materialization Demo - Database Setup")
print("=" * 80)

# Step 1: Connect to system database to create the new database
print(f"\n[1/5] Connecting to Firebolt account '{ACCOUNT_NAME}'...")
try:
    from firebolt.client.auth import ClientCredentials
    
    connection = connect(
        auth=ClientCredentials(CLIENT_ID, CLIENT_SECRET),
        account_name=ACCOUNT_NAME,
        engine_name=ENGINE_NAME,
        database="",  # Connect without a specific database first
        api_endpoint=DEFAULT_API_URL
    )
    cursor = connection.cursor()
    print("✓ Connected successfully")
except Exception as e:
    print(f"✗ Connection failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Step 2: Create database
print(f"\n[2/5] Creating database '{DATABASE_NAME}'...")
try:
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DATABASE_NAME}")
    print(f"✓ Database '{DATABASE_NAME}' created/verified")
except Exception as e:
    print(f"⚠ Database creation: {e}")

# Close and reconnect to the new database
cursor.close()
connection.close()

# Step 3: Reconnect to the new database
print(f"\n[3/5] Connecting to database '{DATABASE_NAME}'...")
try:
    from firebolt.client.auth import ClientCredentials
    
    connection = connect(
        auth=ClientCredentials(CLIENT_ID, CLIENT_SECRET),
        account_name=ACCOUNT_NAME,
        engine_name=ENGINE_NAME,
        database=DATABASE_NAME,
        api_endpoint=DEFAULT_API_URL
    )
    cursor = connection.cursor()
    print("✓ Connected to new database")
except Exception as e:
    print(f"✗ Failed to connect to database: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Step 4: Create demo_events table
print(f"\n[4/5] Creating 'demo_events' table...")
try:
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS demo_events (
            event_id BIGINT,
            event_time TIMESTAMPTZ,
            user_id BIGINT,
            session_id TEXT,
            event_type TEXT,
            page_url TEXT,
            referrer_url TEXT,
            user_agent TEXT,
            ip_address TEXT,
            country TEXT,
            city TEXT,
            device_type TEXT,
            browser TEXT,
            os_name TEXT,
            screen_resolution TEXT,
            page_html TEXT,
            request_headers TEXT,
            response_headers TEXT,
            cookies TEXT,
            local_storage TEXT,
            debug_trace TEXT,
            error_stack TEXT,
            performance_metrics TEXT,
            custom_data TEXT
        ) PRIMARY INDEX event_id
    """)
    print("✓ Table 'demo_events' created")
    
    # Insert sample data
    print("   Inserting sample data...")
    cursor.execute("""
        INSERT INTO demo_events
        SELECT 
            ROW_NUMBER() OVER () AS event_id,
            NOW() - INTERVAL '1 second' * (ROW_NUMBER() OVER ()) AS event_time,
            MOD(ROW_NUMBER() OVER (), 1000) AS user_id,
            'session_' || CAST(MOD(ROW_NUMBER() OVER (), 500) AS TEXT) AS session_id,
            CASE MOD(ROW_NUMBER() OVER (), 5)
                WHEN 0 THEN 'page_view'
                WHEN 1 THEN 'click'
                WHEN 2 THEN 'scroll'
                WHEN 3 THEN 'form_submit'
                ELSE 'api_call'
            END AS event_type,
            '/page/' || CAST(MOD(ROW_NUMBER() OVER (), 100) AS TEXT) AS page_url,
            'https://example.com/ref' AS referrer_url,
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' AS user_agent,
            '192.168.1.' || CAST(MOD(ROW_NUMBER() OVER (), 255) AS TEXT) AS ip_address,
            CASE MOD(ROW_NUMBER() OVER (), 3)
                WHEN 0 THEN 'US'
                WHEN 1 THEN 'UK'
                ELSE 'CA'
            END AS country,
            'City_' || CAST(MOD(ROW_NUMBER() OVER (), 50) AS TEXT) AS city,
            CASE MOD(ROW_NUMBER() OVER (), 3)
                WHEN 0 THEN 'desktop'
                WHEN 1 THEN 'mobile'
                ELSE 'tablet'
            END AS device_type,
            'Chrome' AS browser,
            'Windows' AS os_name,
            '1920x1080' AS screen_resolution,
            '<!DOCTYPE html><html><head><title>Page</title></head><body>' ||
            CAST(ROW_NUMBER() OVER () AS TEXT) || 
            '</body></html>' AS page_html,
            '{"Accept": "text/html", "User-Agent": "Mozilla/5.0"}' AS request_headers,
            '{"Content-Type": "text/html", "Server": "nginx"}' AS response_headers,
            'session_id=abc123; user_pref=dark_mode' AS cookies,
            '{"theme": "dark", "language": "en"}' AS local_storage,
            'DEBUG: Function call at line 42\nDEBUG: Variable x = ' || CAST(ROW_NUMBER() OVER () AS TEXT) AS debug_trace,
            'Error: Null pointer exception at line 100' AS error_stack,
            '{"page_load_time": ' || CAST(MOD(ROW_NUMBER() OVER (), 5000) AS TEXT) || ', "render_time": 250}' AS performance_metrics,
            '{"custom_field_1": "value1", "custom_field_2": "value2"}' AS custom_data
        FROM GENERATE_SERIES(1, 100000)
    """)
    count_result = cursor.execute("SELECT COUNT(*) FROM demo_events").fetchone()
    print(f"✓ Inserted {count_result[0]:,} rows into 'demo_events'")
    
except Exception as e:
    print(f"✗ Error creating/populating demo_events: {e}")

# Step 5: Create api_logs table
print(f"\n[5/5] Creating 'api_logs' table...")
try:
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS api_logs (
            log_id BIGINT,
            log_timestamp TIMESTAMPTZ,
            endpoint TEXT,
            http_method TEXT,
            status_code INT,
            response_time_ms INT,
            request_size_bytes INT,
            response_size_bytes INT,
            client_ip TEXT,
            user_id BIGINT,
            api_key_hash TEXT,
            request_body TEXT,
            response_body TEXT,
            error_message TEXT,
            stack_trace TEXT,
            debug_trace TEXT
        ) PRIMARY INDEX log_id
    """)
    print("✓ Table 'api_logs' created")
    
    # Insert sample data
    print("   Inserting sample data...")
    cursor.execute("""
        INSERT INTO api_logs
        SELECT 
            ROW_NUMBER() OVER () AS log_id,
            NOW() - INTERVAL '1 minute' * (ROW_NUMBER() OVER ()) AS log_timestamp,
            CASE MOD(ROW_NUMBER() OVER (), 5)
                WHEN 0 THEN '/api/v1/users'
                WHEN 1 THEN '/api/v1/orders'
                WHEN 2 THEN '/api/v1/products'
                WHEN 3 THEN '/api/v1/payments'
                ELSE '/api/v1/analytics'
            END AS endpoint,
            CASE MOD(ROW_NUMBER() OVER (), 4)
                WHEN 0 THEN 'GET'
                WHEN 1 THEN 'POST'
                WHEN 2 THEN 'PUT'
                ELSE 'DELETE'
            END AS http_method,
            CASE MOD(ROW_NUMBER() OVER (), 10)
                WHEN 0 THEN 500
                WHEN 1 THEN 404
                WHEN 2 THEN 400
                ELSE 200
            END AS status_code,
            MOD(ROW_NUMBER() OVER (), 5000) + 10 AS response_time_ms,
            MOD(ROW_NUMBER() OVER (), 10000) + 100 AS request_size_bytes,
            MOD(ROW_NUMBER() OVER (), 50000) + 500 AS response_size_bytes,
            '10.0.1.' || CAST(MOD(ROW_NUMBER() OVER (), 255) AS TEXT) AS client_ip,
            MOD(ROW_NUMBER() OVER (), 5000) AS user_id,
            'hash_' || CAST(MOD(ROW_NUMBER() OVER (), 1000) AS TEXT) AS api_key_hash,
            '{"action": "query", "filters": ["active", "premium"]}' AS request_body,
            '{"status": "success", "data": [...], "count": ' || CAST(MOD(ROW_NUMBER() OVER (), 1000) AS TEXT) || '}' AS response_body,
            CASE WHEN MOD(ROW_NUMBER() OVER (), 10) = 0 
                THEN 'Database connection timeout'
                ELSE NULL
            END AS error_message,
            CASE WHEN MOD(ROW_NUMBER() OVER (), 10) = 0
                THEN 'at DatabaseConnection.execute (db.js:123)\nat QueryBuilder.run (query.js:45)'
                ELSE NULL
            END AS stack_trace,
            'TRACE: Query executed in ' || CAST(MOD(ROW_NUMBER() OVER (), 1000) AS TEXT) || 'ms\n' ||
            'TRACE: Rows fetched: ' || CAST(MOD(ROW_NUMBER() OVER (), 10000) AS TEXT) || '\n' ||
            'TRACE: Cache hit: ' || CASE WHEN MOD(ROW_NUMBER() OVER (), 2) = 0 THEN 'true' ELSE 'false' END AS debug_trace
        FROM GENERATE_SERIES(1, 50000)
    """)
    count_result = cursor.execute("SELECT COUNT(*) FROM api_logs").fetchone()
    print(f"✓ Inserted {count_result[0]:,} rows into 'api_logs'")
    
except Exception as e:
    print(f"✗ Error creating/populating api_logs: {e}")

# Cleanup
cursor.close()
connection.close()

print("\n" + "=" * 80)
print("✓ Database setup complete!")
print("=" * 80)
print(f"\nYou can now connect to:")
print(f"  Account: {ACCOUNT_NAME}")
print(f"  Database: {DATABASE_NAME}")
print(f"  Engine: {ENGINE_NAME}")
print(f"\nTables created:")
print(f"  - demo_events: 100,000 rows with wide columns for late materialization testing")
print(f"  - api_logs: 50,000 rows with debug traces for performance analysis")
print("\n" + "=" * 80)

