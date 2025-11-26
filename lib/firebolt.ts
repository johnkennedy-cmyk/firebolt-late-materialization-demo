import { FireboltCredentials, QueryResult } from './types';

// Use require for CommonJS module
const { Firebolt } = require('firebolt-sdk');

export class FireboltClient {
  private credentials: FireboltCredentials;
  private fireboltInstance: any;
  private connection: any;

  constructor(credentials: FireboltCredentials) {
    this.credentials = credentials;
  }

  async getConnection(): Promise<any> {
    if (!this.connection) {
      // Initialize Firebolt client
      this.fireboltInstance = Firebolt();
      
      // Authenticate
      await this.fireboltInstance.authenticate({
        username: this.credentials.clientId,
        password: this.credentials.clientSecret,
      });

      // Connect to database and engine
      this.connection = await this.fireboltInstance.connect({
        database: this.credentials.database,
        engineName: this.credentials.engine,
      });
    }
    return this.connection;
  }

  async testConnection(): Promise<boolean> {
    try {
      const conn = await this.getConnection();
      const statement = await conn.execute('SELECT 1 as test');
      const { data } = await statement.fetchResult();
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async executeQuery(query: string): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      const conn = await this.getConnection();
      const statement = await conn.execute(query);
      const { data, meta } = await statement.fetchResult();
      
      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000; // Convert to seconds

      // Extract column names from metadata
      const columns = meta ? meta.map((col: any) => col.name) : [];
      
      // Determine if query was optimized (has ORDER BY and LIMIT <= 10)
      const optimized = this.isQueryOptimized(query);

      return {
        columns,
        rows: data || [],
        rowCount: data ? data.length : 0,
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

      const statsQuery = `
        SELECT 
          duration_usec,
          scanned_bytes
        FROM information_schema.engine_query_history
        WHERE query_id = '${queryId}'
        LIMIT 1
      `;

      const statement = await conn.execute(statsQuery);
      const { data } = await statement.fetchResult();
      
      if (data && data.length > 0) {
        return {
          duration_usec: data[0][0] || 0,
          scanned_bytes: data[0][1] || 0,
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

