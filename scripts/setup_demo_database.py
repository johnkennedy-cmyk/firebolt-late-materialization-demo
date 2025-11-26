#!/usr/bin/env python3
"""
Firebolt Late Materialization Demo - Database Setup Script

This script creates a dedicated database and loads sample data for the demo.
It demonstrates the complete setup process for the late materialization feature.

Usage:
    python scripts/setup_demo_database.py
"""

import sys
from firebolt.client.auth import ClientCredentials
from firebolt.db import connect
import time

# Firebolt Cloud Credentials
CLIENT_ID = "REDACTED_CLIENT_ID"
CLIENT_SECRET = "REDACTED_CLIENT_SECRET"
ACCOUNT_NAME = "se-demo-account"
ENGINE_NAME = "ecommerceengine"
DATABASE_NAME = "late_materialization_demo"

def print_step(step, message):
    """Print a formatted step message"""
    print(f"\n{'='*60}")
    print(f"STEP {step}: {message}")
    print('='*60)

def create_database():
    """Create the demo database"""
    print_step(1, "Creating Database")
    
    try:
        # Connect to system engine to create database
        auth = ClientCredentials(CLIENT_ID, CLIENT_SECRET)
        connection = connect(
            auth=auth,
            account_name=ACCOUNT_NAME,
            engine_name="system"
        )
        
        cursor = connection.cursor()
        
        # Check if database exists
        cursor.execute(f"""
            SELECT database_name 
            FROM information_schema.databases 
            WHERE database_name = '{DATABASE_NAME}'
        """)
        
        if cursor.fetchone():
            print(f"✓ Database '{DATABASE_NAME}' already exists")
        else:
            # Create database
            cursor.execute(f"CREATE DATABASE {DATABASE_NAME}")
            print(f"✓ Created database '{DATABASE_NAME}'")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"✗ Error creating database: {e}")
        return False

def create_tables():
    """Create demo tables with wide schemas"""
    print_step(2, "Creating Tables")
    
    try:
        auth = ClientCredentials(CLIENT_ID, CLIENT_SECRET)
        connection = connect(
            auth=auth,
            account_name=ACCOUNT_NAME,
            database=DATABASE_NAME,
            engine_name=ENGINE_NAME
        )
        
        cursor = connection.cursor()
        
        # Create demo_events table (wide table for late materialization)
        print("Creating demo_events table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS demo_events (
                event_id BIGINT,
                event_timestamp TIMESTAMP,
                user_id BIGINT,
                session_id TEXT,
                event_type TEXT,
                event_name TEXT,
                event_category TEXT,
                event_value DOUBLE PRECISION,
                page_url TEXT,
                page_title TEXT,
                referrer_url TEXT,
                utm_source TEXT,
                utm_medium TEXT,
                utm_campaign TEXT,
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
                page_html TEXT,
                request_headers TEXT,
                response_headers TEXT,
                cookies TEXT,
                local_storage TEXT,
                session_storage TEXT,
                debug_trace TEXT,
                error_stack TEXT,
                performance_metrics TEXT,
                custom_data TEXT,
                experiment_id TEXT,
                experiment_variant TEXT,
                ab_test_group TEXT,
                user_segment TEXT,
                customer_tier TEXT
            ) PRIMARY INDEX event_id
        """)
        print("✓ Created demo_events table")
        
        # Create api_logs table (for debugging scenario)
        print("Creating api_logs table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_logs (
                log_id BIGINT,
                log_timestamp TIMESTAMP,
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
            ) PRIMARY INDEX log_id
        """)
        print("✓ Created api_logs table")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        return False

def load_sample_data():
    """Load sample data into tables"""
    print_step(3, "Loading Sample Data")
    
    try:
        auth = ClientCredentials(CLIENT_ID, CLIENT_SECRET)
        connection = connect(
            auth=auth,
            account_name=ACCOUNT_NAME,
            database=DATABASE_NAME,
            engine_name=ENGINE_NAME
        )
        
        cursor = connection.cursor()
        
        # Insert sample events (10,000 rows for demo)
        print("Loading sample events...")
        cursor.execute("""
            INSERT INTO demo_events
            SELECT
                ROW_NUMBER() OVER (ORDER BY RANDOM()) as event_id,
                CURRENT_TIMESTAMP - INTERVAL '1 day' * (RANDOM() * 30) as event_timestamp,
                CAST(RANDOM() * 10000 as BIGINT) as user_id,
                'session_' || CAST(RANDOM() * 5000 as TEXT) as session_id,
                CASE CAST(RANDOM() * 5 as INT)
                    WHEN 0 THEN 'page_view'
                    WHEN 1 THEN 'click'
                    WHEN 2 THEN 'form_submit'
                    WHEN 3 THEN 'purchase'
                    ELSE 'custom'
                END as event_type,
                'event_' || CAST(RANDOM() * 100 as TEXT) as event_name,
                'category_' || CAST(RANDOM() * 10 as TEXT) as event_category,
                RANDOM() * 1000 as event_value,
                'https://example.com/page/' || CAST(RANDOM() * 1000 as TEXT) as page_url,
                'Page ' || CAST(RANDOM() * 1000 as TEXT) as page_title,
                'https://example.com/referrer/' || CAST(RANDOM() * 500 as TEXT) as referrer_url,
                'utm_source_' || CAST(RANDOM() * 5 as TEXT) as utm_source,
                'utm_medium_' || CAST(RANDOM() * 3 as TEXT) as utm_medium,
                'utm_campaign_' || CAST(RANDOM() * 10 as TEXT) as utm_campaign,
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' as user_agent,
                '192.168.' || CAST(RANDOM() * 255 as TEXT) || '.' || CAST(RANDOM() * 255 as TEXT) as ip_address,
                CASE CAST(RANDOM() * 5 as INT)
                    WHEN 0 THEN 'US'
                    WHEN 1 THEN 'UK'
                    WHEN 2 THEN 'DE'
                    WHEN 3 THEN 'FR'
                    ELSE 'CA'
                END as country,
                'Region ' || CAST(RANDOM() * 10 as TEXT) as region,
                'City ' || CAST(RANDOM() * 50 as TEXT) as city,
                CASE CAST(RANDOM() * 3 as INT)
                    WHEN 0 THEN 'Desktop'
                    WHEN 1 THEN 'Mobile'
                    ELSE 'Tablet'
                END as device_type,
                CASE CAST(RANDOM() * 3 as INT)
                    WHEN 0 THEN 'Chrome'
                    WHEN 1 THEN 'Firefox'
                    ELSE 'Safari'
                END as browser,
                '120.0.0' as browser_version,
                CASE CAST(RANDOM() * 3 as INT)
                    WHEN 0 THEN 'Windows'
                    WHEN 1 THEN 'MacOS'
                    ELSE 'Linux'
                END as os,
                '10.0' as os_version,
                '1920x1080' as screen_resolution,
                '1920x969' as viewport_size,
                '<!DOCTYPE html><html><body>Page content here with lots of text to make this column large. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</body></html>' as page_html,
                '{"accept": "text/html", "accept-encoding": "gzip, deflate", "user-agent": "Mozilla/5.0..."}' as request_headers,
                '{"content-type": "text/html", "cache-control": "max-age=3600", "server": "nginx"}' as response_headers,
                '{"session_id": "abc123", "user_prefs": {"theme": "dark"}, "cart_items": []}' as cookies,
                '{"recent_searches": ["product A", "product B"], "viewed_items": [1, 2, 3]}' as local_storage,
                '{"temp_data": "some value", "form_state": {"field1": "value1"}}' as session_storage,
                'DEBUG: Function called at line 42 with parameters. Stack trace includes multiple function calls and variable states for detailed debugging purposes.' as debug_trace,
                'Error: TypeError at Object.<anonymous> (/app/index.js:42:5)...' as error_stack,
                '{"page_load": 1234, "dom_ready": 890, "first_paint": 456}' as performance_metrics,
                '{"custom_field_1": "value1", "custom_field_2": 123, "nested": {"data": "here"}}' as custom_data,
                'exp_' || CAST(RANDOM() * 10 as TEXT) as experiment_id,
                CASE CAST(RANDOM() * 2 as INT) WHEN 0 THEN 'control' ELSE 'variant' END as experiment_variant,
                'group_' || CAST(RANDOM() * 4 as TEXT) as ab_test_group,
                CASE CAST(RANDOM() * 3 as INT)
                    WHEN 0 THEN 'new_users'
                    WHEN 1 THEN 'returning_users'
                    ELSE 'power_users'
                END as user_segment,
                CASE CAST(RANDOM() * 3 as INT)
                    WHEN 0 THEN 'free'
                    WHEN 1 THEN 'premium'
                    ELSE 'enterprise'
                END as customer_tier
            FROM generate_series(1, 10000)
        """)
        
        # Get row count
        cursor.execute("SELECT COUNT(*) FROM demo_events")
        count = cursor.fetchone()[0]
        print(f"✓ Loaded {count:,} events")
        
        # Insert sample API logs (1,000 rows)
        print("Loading sample API logs...")
        cursor.execute("""
            INSERT INTO api_logs
            SELECT
                ROW_NUMBER() OVER (ORDER BY RANDOM()) as log_id,
                CURRENT_TIMESTAMP - INTERVAL '1 hour' * (RANDOM() * 24) as log_timestamp,
                '/api/v1/endpoint/' || CAST(RANDOM() * 50 as TEXT) as endpoint,
                CASE CAST(RANDOM() * 4 as INT)
                    WHEN 0 THEN 'GET'
                    WHEN 1 THEN 'POST'
                    WHEN 2 THEN 'PUT'
                    ELSE 'DELETE'
                END as method,
                CASE 
                    WHEN RANDOM() < 0.9 THEN 200
                    WHEN RANDOM() < 0.95 THEN 404
                    ELSE 500
                END as status_code,
                RANDOM() * 5000 as response_time,
                '{"param1": "value1", "param2": "value2"}' as request_body,
                '{"result": "success", "data": [...]}' as response_body,
                'TRACE: Processing request through multiple middleware layers. Authentication passed. Authorization checked. Data validation complete. Database query prepared and executed successfully.' as debug_trace,
                CASE WHEN RANDOM() < 0.1 THEN 'Error: Timeout' ELSE NULL END as error_message,
                CAST(RANDOM() * 10000 as BIGINT) as user_id,
                'key_' || CAST(RANDOM() * 100 as TEXT) as api_key_hash
            FROM generate_series(1, 1000)
        """)
        
        cursor.execute("SELECT COUNT(*) FROM api_logs")
        count = cursor.fetchone()[0]
        print(f"✓ Loaded {count:,} API logs")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"✗ Error loading data: {e}")
        return False

def verify_setup():
    """Verify the setup is complete"""
    print_step(4, "Verifying Setup")
    
    try:
        auth = ClientCredentials(CLIENT_ID, CLIENT_SECRET)
        connection = connect(
            auth=auth,
            account_name=ACCOUNT_NAME,
            database=DATABASE_NAME,
            engine_name=ENGINE_NAME
        )
        
        cursor = connection.cursor()
        
        # Check tables
        cursor.execute("""
            SELECT table_name, 
                   (SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public'
        """)
        
        tables = cursor.fetchall()
        print(f"\n✓ Found {len(tables)} tables:")
        for table_name, col_count in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            row_count = cursor.fetchone()[0]
            print(f"  - {table_name}: {col_count} columns, {row_count:,} rows")
        
        # Test a late materialization query
        print("\n✓ Testing late materialization query:")
        start = time.time()
        cursor.execute("SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 10")
        results = cursor.fetchall()
        elapsed = time.time() - start
        print(f"  - Query returned {len(results)} rows in {elapsed:.3f} seconds")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"✗ Error verifying setup: {e}")
        return False

def main():
    """Main setup function"""
    print("\n🔥 FIREBOLT LATE MATERIALIZATION DEMO - DATABASE SETUP")
    print(f"Account: {ACCOUNT_NAME}")
    print(f"Database: {DATABASE_NAME}")
    print(f"Engine: {ENGINE_NAME}")
    
    # Run setup steps
    if not create_database():
        sys.exit(1)
    
    if not create_tables():
        sys.exit(1)
    
    if not load_sample_data():
        sys.exit(1)
    
    if not verify_setup():
        sys.exit(1)
    
    print_step("COMPLETE", "Database Setup Successful!")
    print(f"""
✓ Database '{DATABASE_NAME}' is ready!

Next steps:
1. Update your .env.local file with:
   FIREBOLT_DATABASE={DATABASE_NAME}
   FIREBOLT_ENGINE={ENGINE_NAME}
   
2. Start the demo:
   npm run dev
   
3. Open http://localhost:3000 and connect using your credentials

The demo now has:
- demo_events table: 10,000 rows with 41 wide columns
- api_logs table: 1,000 rows with 12 columns
- Both tables are optimized for late materialization demonstrations
""")

if __name__ == "__main__":
    main()

