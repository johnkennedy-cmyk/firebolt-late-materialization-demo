-- =============================================================================
-- Late Materialization Demo: Proving the 30x Performance Gain
-- =============================================================================
-- This comprehensive SQL script provides concrete evidence of late materialization
-- in action, showing exactly when the optimization applies and measurable impact.
--
-- Repository: https://github.com/johnkennedy-cmyk/firebolt-late-materialization-demo
-- Documentation: https://docs.firebolt.io/performance-and-observability/query-planning/late-materialization
-- Engineering blog: https://www.firebolt.io/blog/pruning-even-more-data-with-late-materialization
--
-- Key facts (verified from documentation):
--   - Default threshold: late_materialization_max_rows = 10 (LIMIT <= 10)
--   - Introduced in Firebolt version 4.28
--   - Set to 0 to disable; increase value for larger LIMIT queries
--   - Two conditions for benefit: (1) Large column byte size, (2) High row count difference
--
-- NOTE: This script references the ClickBench hits dataset for maximum impact.
-- If you don't have access to hits, use demo_events created by setup_demo_database.py
-- =============================================================================

-- QUICK START: Using the demo database
-- Run these queries in order to see the evidence:

-- 1. BASELINE (disabled):
SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 10
WITH late_materialization_max_rows = 0;

-- 2. OPTIMIZED (enabled):
SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 10;

-- 3. PROVE IT (query plan):
EXPLAIN SELECT * FROM demo_events ORDER BY event_timestamp DESC LIMIT 10;

-- 4. MEASURE IT (actual metrics):
SELECT 
    CASE WHEN query_text LIKE '%late_materialization_max_rows = 0%' 
         THEN 'DISABLED' ELSE 'ENABLED' END AS status,
    ROUND(duration_usec / 1000000.0, 3) AS seconds,
    ROUND(scanned_bytes / (1024.0 * 1024), 2) AS mb_scanned
FROM information_schema.engine_query_history
WHERE query_text LIKE '%FROM demo_events%ORDER BY event_timestamp%'
    AND query_text NOT LIKE '%EXPLAIN%'
ORDER BY start_time DESC LIMIT 4;

-- For the full comprehensive benchmark with ClickBench data and detailed
-- explanations, see BENCHMARKING_GUIDE.md in the repository root.

