import { PrebuiltQuery } from './types';

export const prebuiltQueries: PrebuiltQuery[] = [
  {
    id: 'events-top-10-disabled',
    title: '🔴 STEP 1: DISABLED (Baseline) - RUN THIS FIRST!',
    description: 'Establishes baseline performance WITHOUT late materialization OR caching',
    useCase: '⚠️ CRITICAL: Run this query FIRST (before OPTIMIZED) to establish the baseline. Cache is DISABLED to ensure accurate baseline measurement.',
    sql: 'SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 10\nWITH late_materialization_max_rows = 0, enable_subresult_cache = false',
    optimized: false,
    badge: '🔴 RUN FIRST (No Cache)',
    badgeColor: 'red',
  },
  {
    id: 'events-top-10-optimized',
    title: '🟢 STEP 2: OPTIMIZED - RUN THIS SECOND!',
    description: 'Same query WITH late materialization enabled (cache disabled for fair comparison)',
    useCase: '✅ Run this AFTER the DISABLED query to see the 4-10x speedup. Cache is DISABLED to ensure you see the true performance difference (not cached results).',
    sql: 'SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 10\nWITH enable_subresult_cache = false',
    optimized: true,
    badge: '🟢 RUN SECOND (No Cache)',
    badgeColor: 'green',
    expectedMetrics: {
      beforeTime: 'Baseline',
      afterTime: 'Fast',
      beforeData: 'Full scan',
      afterData: 'Pruned',
    },
  },
  {
    id: 'explain-optimized',
    title: '🔍 EXPLAIN: Show Query Plan (Optimized)',
    description: 'See the TWO-SCAN pattern that proves late materialization is active',
    useCase: 'EVIDENCE: Look for two StoredTable scans joined on $tablet_id and $tablet_row_number. This is the smoking gun that proves the optimization is working.',
    sql: 'EXPLAIN SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 10',
    optimized: true,
    badge: 'Query plan analysis',
    badgeColor: 'blue',
  },
  {
    id: 'explain-disabled',
    title: '🔍 EXPLAIN: Show Query Plan (Disabled)',
    description: 'See the SINGLE-SCAN pattern when optimization is off',
    useCase: 'COMPARISON: You should see only ONE StoredTable scan reading all columns. No join, no $tablet_id references.',
    sql: 'EXPLAIN SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 10\nWITH late_materialization_max_rows = 0',
    optimized: false,
    badge: 'Query plan analysis',
    badgeColor: 'gray',
  },
  {
    id: 'api-debugging-large-column',
    title: 'Large Column Benefit: API Debug Logs',
    description: 'Large debug_trace column (thousands of characters) demonstrates CONDITION 1',
    useCase: 'Shows why COLUMN SIZE matters: The debug_trace field is huge. Late materialization only reads it for 10 rows instead of all 1K rows.',
    sql: `SELECT response_time, endpoint, debug_trace
FROM api_logs
WHERE log_timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY response_time DESC
LIMIT 10`,
    optimized: true,
    badge: 'Large column benefit',
    badgeColor: 'green',
    expectedMetrics: {
      beforeTime: 'Slow (large column)',
      afterTime: 'Fast (pruned)',
      beforeData: 'Full debug traces',
      afterData: '10 rows only',
    },
  },
  {
    id: 'query-history',
    title: '📊 Query History: Measure Performance',
    description: 'See actual metrics from your previous queries',
    useCase: 'VERIFICATION: After running optimized vs disabled queries, this shows you the concrete numbers - execution time and data scanned.',
    sql: `SELECT 
    CASE 
        WHEN query_text LIKE '%late_materialization_max_rows = 0%' 
        THEN 'DISABLED' 
        ELSE 'ENABLED' 
    END AS optimization_status,
    ROUND(duration_us / 1000000.0, 3) AS duration_seconds,
    ROUND(scanned_bytes / (1024.0 * 1024 * 1024), 2) AS scanned_gb,
    scanned_rows,
    TO_CHAR(start_time, 'HH24:MI:SS') as time
FROM information_schema.engine_query_history
WHERE query_text LIKE '%FROM demo_events%ORDER BY%'
    AND query_text NOT LIKE '%EXPLAIN%'
    AND query_text NOT LIKE '%FROM information_schema%'
    AND status = 'ENDED_SUCCESSFULLY'
ORDER BY start_time DESC
LIMIT 10`,
    optimized: true,
    badge: 'Performance metrics',
    badgeColor: 'blue',
  },
  {
    id: 'small-column-no-benefit',
    title: '⚠️ NO BENEFIT: Small Columns',
    description: 'When columns are tiny, optimization overhead exceeds benefit',
    useCase: 'CONDITION 1 VIOLATED: event_type is only a few characters. The two-scan pattern costs more than it saves. Minimal or no improvement expected.',
    sql: 'SELECT event_id, event_type FROM demo_events ORDER BY event_timestamp DESC LIMIT 10',
    optimized: false,
    badge: 'Small columns - no benefit',
    badgeColor: 'gray',
  },
  {
    id: 'limit-100-config',
    title: 'Extended LIMIT: Configure for Larger Results',
    description: 'LIMIT > 10 requires explicit configuration',
    useCase: 'DEFAULT THRESHOLD: By default, only LIMIT ≤ 10 is optimized. Use SET or WITH to extend to larger limits.',
    sql: `SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 100
WITH late_materialization_max_rows = 100`,
    optimized: true,
    badge: 'Extended with config',
    badgeColor: 'blue',
  },
  {
    id: 'session-config',
    title: 'Session Config: SET for All Queries',
    description: 'Configure once for the entire session',
    useCase: 'BEST PRACTICE: Use SET late_materialization_max_rows to apply to all queries in your session.',
    sql: `SET late_materialization_max_rows = 100;
SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 100`,
    optimized: true,
    badge: 'Session-wide config',
    badgeColor: 'blue',
  },
  {
    id: 'decision-matrix',
    title: '📋 Decision Matrix: When Does It Help?',
    description: 'Summary of when late materialization provides benefit',
    useCase: `TWO CONDITIONS (both must be met):
1. COLUMN SIZE: Large TEXT/JSON columns (thousands of characters)
2. ROW COUNT DIFFERENCE: Many rows scanned, few returned

✅ BEST CASE: Wide tables + large columns + small LIMIT = 30x improvement
⚠️  NO BENEFIT: Small columns (2-3 chars) or pre-filtered data
❌ MAY BE SLOWER: Highly selective WHERE clause (already <100 rows)`,
    sql: `-- Run this to see which queries benefited most
SELECT 
    LEFT(query_text, 80) as query_preview,
    ROUND(duration_us / 1000000.0, 2) AS seconds,
    ROUND(scanned_bytes / (1024.0 * 1024 * 1024), 2) AS gb_scanned
FROM information_schema.engine_query_history
WHERE query_text LIKE '%ORDER BY%LIMIT%'
    AND status = 'ENDED_SUCCESSFULLY'
ORDER BY start_time DESC
LIMIT 10`,
    optimized: true,
    badge: 'Analysis guide',
    badgeColor: 'blue',
  },
];

