# Quick Setup Guide - Firebolt Late Materialization Demo

This guide will help you set up a dedicated demo database in under 5 minutes.

## Prerequisites

- Python 3.8+
- Firebolt Cloud account (use service account credentials)
- firebolt-sdk installed (`pip install firebolt-sdk`)

## Step 1: Set Environment Variables

Before running the setup script, export your Firebolt credentials:

```bash
export FIREBOLT_CLIENT_ID="your_client_id_here"
export FIREBOLT_CLIENT_SECRET="your_client_secret_here"
export FIREBOLT_ACCOUNT_NAME="your_account_name"  # Optional, defaults to 'se-demo-account'
export FIREBOLT_ENGINE="your_engine_name"  # Optional, defaults to 'ecommerceengine'
```

**Security Note:** Never hardcode credentials in scripts. Always use environment variables.

## Step 2: Create the Demo Database

Run the automated setup script:

```bash
python scripts/setup_demo_database.py
```

This script will:
1. ✅ Create a new database called `late_materialization_demo`
2. ✅ Create tables: `demo_events` (3M rows, 41 columns) and `api_logs` (1,000 rows, 12 columns)
3. ✅ Load sample data optimized for late materialization demonstrations
4. ✅ Verify the setup with a test query

**Expected output:**
```
STEP 1: Creating Database
✓ Created database 'late_materialization_demo'

STEP 2: Creating Tables
✓ Created demo_events table
✓ Created api_logs table

STEP 3: Loading Sample Data
✓ Loaded 10,000 events
✓ Loaded 1,000 API logs

STEP 4: Verifying Setup
✓ Found 2 tables:
  - demo_events: 41 columns, 3,000,000 rows (~325 MB)
  - api_logs: 12 columns, 1,000 rows
✓ Testing late materialization query:
  - Query returned 10 rows in 0.123 seconds

STEP COMPLETE: Database Setup Successful!
```

## Step 3: Configure the Demo Application

Create your `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
FIREBOLT_DATABASE=late_materialization_demo
FIREBOLT_ENGINE=ecommerceengine
FIREBOLT_CLIENT_ID=your_client_id_here
FIREBOLT_CLIENT_SECRET=your_client_secret_here
```

## Step 4: Start the Demo

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Step 5: Connect and Test

1. Enter your Firebolt credentials in the connection form
2. Click "Test Connection"
3. Once connected, try the pre-built queries:
   - **Events Top 10** - See automatic optimization (LIMIT ≤ 10)
   - **API Debugging** - Production debugging scenario
   - **LIMIT 100 examples** - See how to configure for larger limits

## Database Schema

### demo_events (41 columns, 3,000,000 rows)

Wide table designed to maximize late materialization benefits:
- **Core fields**: event_id, timestamp, user_id, session_id
- **Event details**: event_type, event_name, event_category, event_value
- **URL tracking**: page_url, referrer_url, utm_source, utm_medium, utm_campaign
- **User/Device**: user_agent, ip_address, country, city, device_type, browser, os
- **Large text fields**: page_html, debug_trace, request_headers, response_headers, cookies, local_storage (these maximize the benefit of late materialization)
- **Metadata**: experiment_id, ab_test_group, user_segment, customer_tier

### api_logs (12 columns, 1,000 rows)

Designed for the debugging scenario from the blog post:
- **Core fields**: log_id, timestamp, endpoint, method, status_code
- **Performance**: response_time (key for ORDER BY queries)
- **Large text field**: debug_trace (simulates detailed logging)
- **Request/Response**: request_body, response_body
- **Error tracking**: error_message

## Troubleshooting

### Script fails with "firebolt-sdk not installed"

```bash
pip install firebolt-sdk
```

### Connection fails in demo

1. Verify credentials in `.env.local`
2. Check that the engine is running in Firebolt console
3. Ensure you have permissions on the `late_materialization_demo` database

### No data in tables

Re-run the setup script:
```bash
python scripts/setup_demo_database.py
```

The script will skip creating existing database/tables and only load data.

### Query returns no results

Check that you're connected to the correct database:
```sql
SELECT CURRENT_DATABASE() as db
```

Should return: `late_materialization_demo`

## What the Data Shows

The sample data is designed to demonstrate late materialization in real-world scenarios:

1. **Wide tables with many columns** - The `demo_events` table has 41 columns, many with large text content
2. **Varied event types** - Page views, clicks, form submissions, purchases
3. **Recent data** - Events from the last 30 days for realistic timestamp ordering
4. **API performance data** - Response times ranging from 0-5000ms to show "slowest requests" queries
5. **Large text fields** - HTML content, debug traces, headers (50-100 repetitions to simulate real data volume)

## Next Steps

Once the demo is running:

1. **Try pre-built queries** - See the 6 examples demonstrating different optimization scenarios
2. **Write custom queries** - Use the Monaco editor to experiment with your own SQL
3. **Compare performance** - Watch the performance dashboard to see optimization impact
4. **Share the demo** - The GitHub repo is public and ready to share!

## Clean Up

To remove the demo database when you're done:

```python
from firebolt.client.auth import ClientCredentials
from firebolt.db import connect

auth = ClientCredentials("your_client_id", "your_client_secret")
conn = connect(auth=auth, account_name="se-demo-account", engine_name="system")
cursor = conn.cursor()
cursor.execute("DROP DATABASE late_materialization_demo")
```

---

**Need help?** Open an issue on GitHub or check the full README.md for detailed documentation.

