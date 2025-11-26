const { Firebolt } = require('firebolt-sdk');
import { FireboltCredentials, QueryResult } from './types';

export class FireboltClient {
  private credentials: FireboltCredentials;
  private client: any;

  constructor(credentials: FireboltCredentials) {
    this.credentials = credentials;
  }

  async connect(): Promise<void> {
    try {
      this.client = Firebolt({
        auth: {
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
        },
      });
    } catch (error) {
      console.error('Failed to initialize Firebolt client:', error);
      throw new Error('Failed to connect to Firebolt');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        await this.connect();
      }
      
      const connection = await this.client.connect({
        database: this.credentials.database,
        engineName: this.credentials.engine,
      });

      // Test with a simple query
      const statement = await connection.execute('SELECT 1 as test');
      const result = await statement.fetchResult();
      
      return result && result.rows && result.rows.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async executeQuery(query: string): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      if (!this.client) {
        await this.connect();
      }

      const connection = await this.client.connect({
        database: this.credentials.database,
        engineName: this.credentials.engine,
      });

      const statement = await connection.execute(query);
      const result = await statement.fetchResult();
      
      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000; // Convert to seconds

      // Extract metadata
      const meta = result.meta || [];
      const columns = meta.map((col: any) => col.name || '');
      const rows = result.rows || [];
      
      // Determine if query was optimized (has ORDER BY and LIMIT <= 10)
      const optimized = this.isQueryOptimized(query);

      return {
        columns,
        rows,
        rowCount: rows.length,
        executionTime,
        dataScanned: 0, // SDK doesn't provide this directly, would need query stats
        query,
        timestamp: Date.now(),
        optimized,
      };
    } catch (error: any) {
      console.error('Query execution failed:', error);
      throw new Error(error.message || 'Query execution failed');
    }
  }

  async getQueryStats(queryId: string): Promise<{ duration_usec: number; scanned_bytes: number }> {
    try {
      if (!this.client) {
        await this.connect();
      }

      const connection = await this.client.connect({
        database: this.credentials.database,
        engineName: this.credentials.engine,
      });

      const statsQuery = `
        SELECT 
          duration_usec,
          scanned_bytes
        FROM information_schema.engine_query_history
        WHERE query_id = '${queryId}'
        LIMIT 1
      `;

      const statement = await connection.execute(statsQuery);
      const result = await statement.fetchResult();
      
      if (result.rows && result.rows.length > 0) {
        return {
          duration_usec: result.rows[0][0] || 0,
          scanned_bytes: result.rows[0][1] || 0,
        };
      }
      
      return { duration_usec: 0, scanned_bytes: 0 };
    } catch (error) {
      console.error('Failed to get query stats:', error);
      return { duration_usec: 0, scanned_bytes: 0 };
    }
  }

  private isQueryOptimized(query: string): boolean {
    const upperQuery = query.toUpperCase();
    const hasOrderBy = upperQuery.includes('ORDER BY');
    const hasLimit = upperQuery.includes('LIMIT');
    
    if (!hasOrderBy || !hasLimit) {
      return false;
    }

    // Extract LIMIT value
    const limitMatch = upperQuery.match(/LIMIT\s+(\d+)/);
    if (limitMatch) {
      const limitValue = parseInt(limitMatch[1], 10);
      // Check if LIMIT <= 10 OR if late_materialization_max_rows is set
      if (limitValue <= 10) {
        return true;
      }
      // Check for WITH clause or SET command
      if (upperQuery.includes('LATE_MATERIALIZATION_MAX_ROWS')) {
        return true;
      }
    }

    return false;
  }
}

export async function validateCredentials(
  credentials: FireboltCredentials
): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = new FireboltClient(credentials);
    const isValid = await client.testConnection();
    
    if (isValid) {
      return { valid: true };
    } else {
      return { valid: false, error: 'Connection test failed' };
    }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Invalid credentials' };
  }
}

