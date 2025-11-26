import { PrebuiltQuery } from './types';

export const prebuiltQueries: PrebuiltQuery[] = [
  {
    id: 'events-top-10',
    title: 'Events Top 10',
    description: 'Get the 10 most recent events',
    useCase: 'Customer-facing analytics: Perfect for leaderboards, recent activity feeds, and dashboards. This query is automatically optimized with no configuration needed.',
    sql: 'SELECT * FROM events ORDER BY timestamp DESC LIMIT 10',
    optimized: true,
    badge: 'Optimized automatically',
    badgeColor: 'green',
    expectedMetrics: {
      beforeTime: '16 seconds',
      afterTime: '0.5 seconds',
      beforeData: '87 GB',
      afterData: '1.5 GB',
    },
  },
  {
    id: 'api-debugging',
    title: 'API Debugging',
    description: 'Find the 10 slowest API requests from the last hour',
    useCase: 'Operational monitoring: Critical for debugging production incidents. Automatically optimized even with large debug_trace columns.',
    sql: `SELECT response_time, endpoint, debug_trace
FROM api_logs
WHERE timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY response_time DESC
LIMIT 10`,
    optimized: true,
    badge: 'Optimized automatically',
    badgeColor: 'green',
    expectedMetrics: {
      beforeTime: '11 seconds',
      afterTime: '0.2 seconds',
      beforeData: '45 GB',
      afterData: '0.8 GB',
    },
  },
  {
    id: 'no-limit',
    title: 'No LIMIT',
    description: 'Get all events without a LIMIT clause',
    useCase: 'Shows when late materialization does NOT apply. Without a LIMIT, all rows must be processed.',
    sql: 'SELECT * FROM events ORDER BY timestamp DESC',
    optimized: false,
    badge: 'Not optimized - no LIMIT',
    badgeColor: 'gray',
  },
  {
    id: 'limit-100-no-config',
    title: 'LIMIT 100 (No Config)',
    description: 'Get 100 events without configuration',
    useCase: 'Demonstrates the default threshold. LIMIT > 10 requires explicit configuration to enable optimization.',
    sql: 'SELECT * FROM events ORDER BY timestamp DESC LIMIT 100',
    optimized: false,
    badge: 'Not optimized - LIMIT > 10',
    badgeColor: 'gray',
  },
  {
    id: 'limit-100-with-clause',
    title: 'LIMIT 100 (WITH Clause)',
    description: 'Get 100 events with inline configuration',
    useCase: 'E-commerce & retail: Analyze top products or transactions. The WITH clause enables optimization for larger result sets.',
    sql: `SELECT * FROM events ORDER BY timestamp DESC LIMIT 100
WITH late_materialization_max_rows = 100`,
    optimized: true,
    badge: 'Optimized with WITH clause',
    badgeColor: 'blue',
    expectedMetrics: {
      beforeTime: '18 seconds',
      afterTime: '0.8 seconds',
      beforeData: '87 GB',
      afterData: '3.2 GB',
    },
  },
  {
    id: 'limit-100-session-config',
    title: 'LIMIT 100 (SET Command)',
    description: 'Set configuration for the session, then query',
    useCase: 'AdTech & marketing: Analyze top-performing campaigns. SET applies to all subsequent queries in the session.',
    sql: `SET late_materialization_max_rows = 100;
SELECT * FROM events ORDER BY timestamp DESC LIMIT 100`,
    optimized: true,
    badge: 'Optimized with SET',
    badgeColor: 'blue',
    expectedMetrics: {
      beforeTime: '18 seconds',
      afterTime: '0.8 seconds',
      beforeData: '87 GB',
      afterData: '3.2 GB',
    },
  },
];

