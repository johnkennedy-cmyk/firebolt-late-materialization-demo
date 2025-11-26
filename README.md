# Firebolt Late Materialization Demo

**Interactive demo of Firebolt's automatic query optimization delivering 30x faster top-K queries**

![Firebolt Late Materialization](https://img.shields.io/badge/Firebolt-4.28+-orange)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 📖 What is Late Materialization?

Late materialization is an automatic query optimization introduced in Firebolt 4.28 that dramatically accelerates top-K queries (queries with `ORDER BY` + `LIMIT`). Instead of reading all columns for all rows before sorting, Firebolt:

1. **Reads only the sorting column** to identify which rows qualify
2. **Fetches remaining columns** for just those qualifying rows
3. **Returns results up to 30x faster** with 50x less data scanned

**The best part?** It's completely automatic for `LIMIT ≤ 10`. No configuration needed!

## 🎯 Features

- **Interactive Query Execution**: Run pre-built examples or write custom SQL queries
- **Real-Time Performance Metrics**: See actual execution time and data scanned
- **Visual Comparisons**: Charts showing optimized vs. non-optimized query performance
- **6 Example Queries**: Demonstrating when late materialization applies and when it doesn't
- **Secure Connection**: Credentials never exposed to the browser (API routes handle all database communication)
- **Query History**: Track your queries and compare performance across runs

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** installed on your system
- **Firebolt Cloud account** with a database and engine ([Start with $200 free credits](https://firebolt.io/signup))
- **Service account credentials** (Client ID and Client Secret)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/firebolt-late-materialization-demo.git
cd firebolt-late-materialization-demo

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Firebolt credentials
nano .env.local
```

### Configuration

Edit `.env.local` with your Firebolt credentials:

```env
FIREBOLT_DATABASE=your_database_name
FIREBOLT_ENGINE=your_engine_name
FIREBOLT_CLIENT_ID=your_client_id_here
FIREBOLT_CLIENT_SECRET=your_client_secret_here
```

**⚠️ IMPORTANT:** Never commit `.env.local` to version control. Your credentials should remain private.

### Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Setting Up Firebolt

### Creating a Service Account

1. Log in to your [Firebolt workspace](https://app.firebolt.io)
2. Navigate to **Settings** → **Service Accounts**
3. Click **Create Service Account**
4. Give it a name (e.g., "Late Materialization Demo")
5. Copy the **Client ID** and **Client Secret** (store them securely!)
6. Assign appropriate permissions (read access to your database)

### Finding Your Database and Engine Names

1. In your Firebolt workspace, go to **Databases**
2. Note your database name (e.g., `experimental_john`)
3. Go to **Engines** and note the engine name (e.g., `ecommerceengine`)

### Sample Data Setup

For the best demonstration of late materialization, you need a table with:
- **Many rows** (ideally 10M+, but works with any size)
- **Many columns** (20+)
- **Large text fields** or JSON columns (maximizes the benefit)

#### Option 1: Use Your Existing Data

If you already have wide tables with many rows, you can modify the example queries in the demo to use your table names.

#### Option 2: Create a Demo Table

Use the provided SQL script:

```bash
# See scripts/create-demo-data.sql for the full schema
```

Run in your Firebolt SQL workspace:

```sql
-- Create the demo_events table
CREATE TABLE demo_events (
  event_id BIGINT,
  timestamp TIMESTAMP,
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
  os TEXT,
  screen_resolution TEXT,
  -- Large payload columns (maximize late materialization benefit)
  page_html TEXT,
  request_headers TEXT,
  response_headers TEXT,
  cookies TEXT,
  local_storage TEXT,
  debug_trace TEXT,
  error_stack TEXT,
  performance_metrics TEXT,
  custom_data TEXT
) PRIMARY INDEX event_id;

-- Load your data (adapt to your data source)
-- COPY INTO demo_events FROM 's3://your-bucket/data/'
-- WITH CREDENTIALS = (AWS_KEY_ID = 'xxx' AWS_SECRET_KEY = 'yyy');
```

Alternatively, use the provided data generation script (see `scripts/generate-sample-data.sql`).

## 📊 Using the Demo

### 1. Connect to Firebolt

Enter your credentials in the connection form at the top of the page. Click "Test Connection" to verify.

### 2. Try Pre-Built Examples

The "Pre-built Examples" tab includes 6 queries:

1. **Events Top 10** - Automatic optimization (LIMIT ≤ 10)
2. **API Debugging** - Slowest requests (production scenario)
3. **No LIMIT** - Shows when optimization doesn't apply
4. **LIMIT 100 (No Config)** - Not optimized by default
5. **LIMIT 100 (WITH Clause)** - Using inline configuration
6. **LIMIT 100 (SET Command)** - Using session configuration

Click "Run Query" on any example to see real performance metrics.

### 3. Write Custom Queries

Switch to the "Query Editor" tab to write your own SQL. The Monaco editor provides syntax highlighting and helpful tips.

**Try these patterns:**

```sql
-- Automatic optimization (LIMIT ≤ 10)
SELECT * FROM your_table ORDER BY timestamp DESC LIMIT 10

-- Configure for larger limits (inline)
SELECT * FROM your_table ORDER BY timestamp DESC LIMIT 100
WITH late_materialization_max_rows = 100

-- Configure for session
SET late_materialization_max_rows = 100;
SELECT * FROM your_table ORDER BY timestamp DESC LIMIT 100
```

### 4. Analyze Performance

View real-time metrics:
- **Execution Time**: How long the query took
- **Data Scanned**: How much data was read
- **Optimization Status**: Whether late materialization was applied

The performance dashboard shows visual comparisons across all your queries.

## 🏗️ Architecture

### Security by Design

This demo uses **Next.js API Routes** to keep your Firebolt credentials secure:

```
Browser → API Route (Next.js) → Firebolt Cloud
         (credentials)        (results only)
```

- Credentials are stored in **sessionStorage** (browser-side, temporary)
- All database queries execute **server-side** in API routes
- Credentials are **never exposed** to the client JavaScript bundle
- No credentials in URLs, local storage, or browser console

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database SDK**: firebolt-sdk v1.14.1
- **UI**: Tailwind CSS
- **Code Editor**: Monaco Editor (VS Code editor in the browser)
- **Charts**: Recharts for performance visualizations
- **Icons**: Lucide React

### Project Structure

```
firebolt-late-materialization-demo/
├── app/
│   ├── api/
│   │   ├── query/route.ts          # Executes SQL queries
│   │   └── test-connection/route.ts # Tests credentials
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Main application page
│   └── globals.css                  # Global styles
├── components/
│   ├── ConnectionForm.tsx           # Credential input & connection
│   ├── InfoBanner.tsx              # Educational banner
│   ├── PrebuiltQueries.tsx         # 6 example queries
│   ├── QueryEditor.tsx             # Monaco SQL editor
│   ├── ResultsDisplay.tsx          # Query results & metrics
│   └── PerformanceChart.tsx        # Performance visualizations
├── lib/
│   ├── firebolt.ts                 # Firebolt SDK wrapper
│   ├── types.ts                    # TypeScript types
│   └── prebuiltQueries.ts          # Example query definitions
└── scripts/
    └── create-demo-data.sql        # Sample table schema
```

## 🔍 Understanding Late Materialization

### When It Applies

Late materialization automatically optimizes queries that:

✅ Have `ORDER BY` clause  
✅ Have `LIMIT` clause  
✅ `LIMIT ≤ 10` (automatic) OR configured with `late_materialization_max_rows`

### When It Doesn't Apply

❌ No `LIMIT` clause  
❌ `LIMIT > 10` without configuration  
❌ No `ORDER BY` clause  
❌ Queries with `DISTINCT`, `GROUP BY`, or aggregations

### Performance Expectations

The speedup depends on:
- **Table width**: More columns = bigger speedup
- **Column sizes**: Large TEXT/JSON fields = bigger speedup
- **LIMIT value**: Smaller limit = bigger speedup

**Real-world examples:**

| Scenario | Before | After | Speedup |
|----------|--------|-------|---------|
| 100M rows, 105 columns | 16s, 87 GB | 0.5s, 1.5 GB | 32x faster |
| API logs, debug traces | 11s, 45 GB | 0.2s, 0.8 GB | 55x faster |
| Wide e-commerce table | 18s, 87 GB | 0.8s, 3.2 GB | 22x faster |

## 🔒 Security Best Practices

1. **Never commit credentials** to version control
   - Use `.env.local` for local development
   - Use environment variables in production
   - Add `.env*` to `.gitignore`

2. **Use service accounts** with minimal permissions
   - Grant only `SELECT` on necessary tables
   - Rotate credentials regularly

3. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update packages with security patches

4. **Rate limiting** is built-in
   - 50 requests per minute per IP
   - Prevents abuse in public deployments

## 🐛 Troubleshooting

### Connection Fails

**Error:** "Connection test failed"

- Verify your Client ID and Client Secret are correct
- Ensure your service account has permissions on the database
- Check that the engine is running (not stopped)
- Verify database and engine names match exactly

### Query Fails

**Error:** "Table does not exist"

- The example queries use `events` and `api_logs` tables
- Replace with your actual table names
- Or create demo tables using the provided SQL scripts

### Slow Performance

If queries are slower than expected:

- Check your table has sufficient data (ideally 10M+ rows)
- Ensure table has many columns (20+)
- Verify `LIMIT ≤ 10` or `late_materialization_max_rows` is set
- Check engine size (larger engines = faster queries)

### Build Errors

**Error:** Module not found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📚 Learn More

- **[Blog Post](https://www.firebolt.io/blog/pruning-even-more-data-with-late-materialization)**: Deep dive into late materialization
- **[Documentation](https://docs.firebolt.io/performance-and-observability/query-planning/late-materialization)**: Official Firebolt docs
- **[Firebolt Website](https://firebolt.io)**: Learn about Firebolt
- **[Start Free Trial](https://firebolt.io/signup)**: $200 in free credits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Firebolt](https://firebolt.io)
- Icons by [Lucide](https://lucide.dev/)

---

**Fast analytics shouldn't require constant engineering investment.** Firebolt's automatic optimizations let your team focus on building products while the system handles performance. Late materialization is the latest example of this philosophy in action.

