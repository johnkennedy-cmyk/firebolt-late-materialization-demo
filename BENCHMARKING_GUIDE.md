# Late Materialization Benchmarking Guide

This guide shows you how to **prove** the 30x performance improvement with concrete evidence.

## 🎯 The Goal: Evidence-Based Performance Comparison

Unlike claims, we provide **reproducible proof**:
1. Query plans showing the optimization pattern
2. Before/after metrics from query history
3. Clear understanding of when it helps (and when it doesn't)

## 📊 Step 1: Run the Baseline (DISABLED)

First, establish your baseline by **disabling** late materialization:

```sql
SELECT * FROM demo_events 
ORDER BY event_timestamp DESC 
LIMIT 10
WITH late_materialization_max_rows = 0;
```

**What this does:** Forces the traditional single-scan approach - reads ALL columns for ALL rows before sorting.

**Note the metrics:**
- Execution time
- Data scanned
- Rows returned (should be 10)

## ⚡ Step 2: Run the Optimized Version (ENABLED)

Now run the same query WITH late materialization (default in Firebolt 4.28+):

```sql
SELECT * FROM demo_events 
ORDER BY event_timestamp DESC 
LIMIT 10;
```

**What this does:** Uses the two-scan approach - reads only sorting column first, then fetches other columns for just 10 rows.

**Note the metrics:**
- Execution time (should be much faster)
- Data scanned (should be much less)
- Rows returned (still 10, same results)

## 🔍 Step 3: PROVE IT - View Query Plans

### Show the Optimized Plan:

```sql
EXPLAIN SELECT * FROM demo_events 
ORDER BY event_timestamp DESC 
LIMIT 10;
```

**Look for these KEY INDICATORS:**
- ✅ **TWO** StoredTable scans (not one)
- ✅ Join operation on `$tablet_id` and `$tablet_row_number`
- ✅ First scan reads: event_timestamp + row identifiers only
- ✅ Second scan reads: ALL columns but **pruned to 10 rows** via join
- ✅ "Relaxed Limit" annotation on the first sort

### Compare with Disabled Plan:

```sql
EXPLAIN SELECT * FROM demo_events 
ORDER BY event_timestamp DESC 
LIMIT 10
WITH late_materialization_max_rows = 0;
```

**Should see:**
- ❌ Only **ONE** StoredTable scan
- ❌ No join operation
- ❌ No `$tablet_id` or `$tablet_row_number` references
- ❌ Single scan reads ALL columns for ALL rows

## 📈 Step 4: Compare Actual Metrics

Query the history to see concrete numbers:

```sql
SELECT 
    CASE 
        WHEN query_text LIKE '%late_materialization_max_rows = 0%' 
        THEN 'DISABLED' 
        ELSE 'ENABLED' 
    END AS optimization_status,
    ROUND(duration_usec / 1000000.0, 3) AS duration_seconds,
    ROUND(scanned_bytes / (1024.0 * 1024 * 1024), 2) AS scanned_gb,
    rows_returned
FROM information_schema.engine_query_history
WHERE query_text LIKE '%FROM demo_events%ORDER BY event_timestamp DESC LIMIT 10%'
    AND query_text NOT LIKE '%EXPLAIN%'
    AND query_text NOT LIKE '%information_schema%'
    AND status = 'ENDED_SUCCESSFULLY'
ORDER BY start_time DESC
LIMIT 4;
```

**Expected output:**

| optimization_status | duration_seconds | scanned_gb | rows_returned |
|---------------------|------------------|------------|---------------|
| ENABLED             | 0.XX             | X.X        | 10            |
| DISABLED            | X.XX             | XX.X       | 10            |

**Calculate your improvement:**
- Speedup factor: `DISABLED time / ENABLED time`
- Data reduction: `DISABLED data / ENABLED data`

## 🎓 Understanding the Two Conditions

From the [official documentation](https://docs.firebolt.io/performance-and-observability/query-planning/late-materialization), late materialization benefits require **BOTH** conditions:

### Condition 1: Large Column Size

**Why it matters:** The larger the columns loaded late, the bigger the savings.

**Example - Large benefit:**
```sql
-- debug_trace is thousands of characters per row
SELECT response_time, debug_trace
FROM api_logs
ORDER BY response_time DESC
LIMIT 10;
```

**Example - No benefit:**
```sql
-- event_type is only 2-3 characters per row
SELECT event_type
FROM demo_events
ORDER BY event_timestamp DESC
LIMIT 10;
```

**From the docs:** "If there is a huge string column where each element is thousands of characters long on average, it will be much faster to only load parts of this data."

### Condition 2: High Row Count Difference

**Why it matters:** Optimization only helps if many rows are scanned but few are returned.

**Example - Large benefit:**
```sql
-- Scans 10,000 rows, returns 10
SELECT * FROM demo_events
ORDER BY event_timestamp DESC
LIMIT 10;
```

**Example - No benefit (or slower):**
```sql
-- WHERE already filters to ~50 rows total
SELECT * FROM demo_events
WHERE event_timestamp <= '2025-01-01'
ORDER BY event_timestamp DESC
LIMIT 10;
```

**From the docs:** "If your table has only 10 rows, you don't need late materialization."

## ✅ Best Case Scenarios

Late materialization provides **maximum benefit** when:

1. **Wide tables** - Many columns (20+)
2. **Large columns** - TEXT fields with thousands of characters, JSON blobs
3. **Small LIMIT** - LIMIT 10 or even LIMIT 100 with config
4. **Millions of rows** - Large table with minimal filtering

**Real-world example from ClickBench:**
- Query: `SELECT * FROM hits ORDER BY EventTime DESC LIMIT 10`
- Dataset: 100M rows, 105 columns
- Result: **16s → 0.5s** (32x faster), **87GB → 1.5GB** (58x less data)

## ⚠️ When It Doesn't Help

Late materialization provides **no benefit** or may be **slower** when:

1. **Small columns only** - VARCHAR(2), INT, small enums
2. **Pre-filtered data** - WHERE clause already reduces to <100 rows
3. **Large LIMIT** - LIMIT approaching total row count
4. **Tiny tables** - Only hundreds of rows total

**From the engineering blog:** "UserAgentMinor is a very short string column. There are usually only two characters per element. This is so little data that late materialization just does not pay off."

## 🔧 Configuration Options

### Default Behavior (Firebolt 4.28+)
```sql
-- Automatic for LIMIT ≤ 10
SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 10;
```

### Extend to Larger Limits (Per Query)
```sql
-- Use WITH clause for single query
SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 100
WITH late_materialization_max_rows = 100;
```

### Extend to Larger Limits (Session)
```sql
-- Use SET for all queries in session
SET late_materialization_max_rows = 100;
SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 100;
```

### Disable for Testing
```sql
-- Set to 0 to disable
SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 10
WITH late_materialization_max_rows = 0;
```

## 📚 Resources

- **Documentation:** https://docs.firebolt.io/performance-and-observability/query-planning/late-materialization
- **Engineering Blog:** https://www.firebolt.io/blog/pruning-even-more-data-with-late-materialization
- **GitHub Demo:** https://github.com/johnkennedy-cmyk/firebolt-late-materialization-demo

## 🎯 Quick Verification Checklist

Use this checklist to verify late materialization is working:

- [ ] Run query with `WITH late_materialization_max_rows = 0` (baseline)
- [ ] Run same query without (optimized)
- [ ] Check `EXPLAIN` output for two-scan pattern with `$tablet_id` join
- [ ] Query `information_schema.engine_query_history` for metrics
- [ ] Calculate speedup factor and data reduction
- [ ] Verify both conditions are met (large columns + row count difference)

If you see **32x speedup** and **58x data reduction** on wide tables with small LIMITs, late materialization is working perfectly!

