import { ClientCredentials } from 'firebolt-sdk/auth';
import { connect } from 'firebolt-sdk/db';
import { FireboltCredentials, QueryResult } from './types';

export class FireboltClient {
  private credentials: FireboltCredentials;
  private connection: any;

  constructor(credentials: FireboltCredentials) {
    this.credentials = credentials;
  }

  async getConnection(): Promise<any> {
    if (!this.connection) {
      const auth = new ClientCredentials(
        this.credentials.clientId,
        this.credentials.clientSecret
      );

      this.connection = await connect({
        auth,
        database: this.credentials.database,
        engineName: this.credentials.engine,
      });
    }
    return this.connection;
  }

  async testConnection(): Promise<boolean> {
    try {
      const conn = await this.getConnection();
      const cursor = conn.cursor();
      
      await cursor.execute('SELECT 1 as test');
      const result = await cursor.fetchall();
      
      return result && result.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async executeQuery(query: string): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      const conn = await this.getConnection();
      const cursor = conn.cursor();
      
      await cursor.execute(query);
      const rows = await cursor.fetchall();
      
      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000; // Convert to seconds

      // Extract column names from cursor description
      const columns = cursor.description ? cursor.description.map((col: any) => col[0]) : [];
      
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
      const conn = await this.getConnection();
      const cursor = conn.cursor();

      const statsQuery = `
        SELECT 
          duration_usec,
          scanned_bytes
        FROM information_schema.engine_query_history
        WHERE query_id = '${queryId}'
        LIMIT 1
      `;

      await cursor.execute(statsQuery);
      const result = await cursor.fetchall();
      
      if (result && result.length > 0) {
        return {
          duration_usec: result[0][0] || 0,
          scanned_bytes: result[0][1] || 0,
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

