// Type definitions for the Firebolt Late Materialization Demo

export interface FireboltCredentials {
  accountName: string;
  database: string;
  engine: string;
  clientId: string;
  clientSecret: string;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number; // in seconds
  dataScanned: number; // in bytes
  query: string;
  timestamp: number;
  optimized: boolean;
}

export interface QueryMetrics {
  executionTime: number;
  dataScanned: number;
  rowCount: number;
  optimized: boolean;
}

export interface PrebuiltQuery {
  id: string;
  title: string;
  description: string;
  useCase: string;
  sql: string;
  optimized: boolean;
  badge: string;
  badgeColor: 'green' | 'gray' | 'blue' | 'red';
  expectedMetrics?: {
    beforeTime: string;
    afterTime: string;
    beforeData: string;
    afterData: string;
  };
}

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  executionTime: number;
  dataScanned: number;
  rowCount: number;
  optimized: boolean;
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  database?: string;
  engine?: string;
  error?: string;
}

