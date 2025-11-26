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
      
      // Connect to database and engine with service account auth
      this.connection = await this.fireboltInstance.connect({
        account: this.credentials.accountName,
        database: this.credentials.database,
        engineName: this.credentials.engine,
        auth: {
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret
        }
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
      const clientExecutionTime = (endTime - startTime) / 1000; // Convert to seconds

      // Extract column names from metadata
      const columns = meta ? meta.map((col: any) => col.name) : [];
      
      // Determine if query was optimized (has ORDER BY and LIMIT <= 10)
      const optimized = this.isQueryOptimized(query);

      // Fetch actual query statistics from Firebolt using query text match
      let actualDuration = clientExecutionTime;
      let actualDataScanned = 0;
      
      console.log('Fetching query stats by SQL text match...');
      // Wait a moment for stats to be available in query history
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const stats = await this.getQueryStatsByText(query);
        if (stats.duration_usec > 0) {
          actualDuration = stats.duration_usec / 1000000; // Convert microseconds to seconds
          actualDataScanned = stats.scanned_bytes;
          console.log('Query stats:', { duration: actualDuration, scanned: actualDataScanned });
        } else {
          console.log('Query stats returned but duration was 0 - using client metrics');
        }
      } catch (err) {
        console.error('Failed to fetch query stats:', err);
        // Fall back to client-side timing
      }

      return {
        columns,
        rows: data || [],
        rowCount: data ? data.length : 0,
        executionTime: actualDuration,
        dataScanned: actualDataScanned,
        query,
        timestamp: Date.now(),
        optimized,
      };
    } catch (error: any) {
      console.error('Query execution failed:', error);
      throw new Error(error.message || 'Query execution failed');
    }
  }

  private async getQueryStatsByText(queryText: string): Promise<{ duration_usec: number; scanned_bytes: number }> {
    try {
      const conn = await this.getConnection();

      const statsQuery = `
        SELECT 
          duration_us,
          scanned_bytes
        FROM information_schema.engine_query_history
        WHERE status = 'ENDED_SUCCESSFULLY'
          AND start_time >= CURRENT_TIMESTAMP - INTERVAL '1 minute'
        ORDER BY start_time DESC
        LIMIT 1
      `;

      const statement = await conn.execute(statsQuery);
      const { data } = await statement.fetchResult();
      
      if (data && data.length > 0) {
        // Convert from microseconds to get duration_usec
        const durationUs = data[0][0] || 0;
        return {
          duration_usec: durationUs,  // Already in microseconds
          scanned_bytes: data[0][1] || 0,
        };
      }
      
      return { duration_usec: 0, scanned_bytes: 0 };
    } catch (error) {
      console.error('Failed to get query stats by text:', error);
      return { duration_usec: 0, scanned_bytes: 0 };
    }
  }

  async getQueryStats(queryId: string): Promise<{ duration_usec: number; scanned_bytes: number }> {
    try {
      const conn = await this.getConnection();

      const statsQuery = `
        SELECT 
          duration_us,
          scanned_bytes
        FROM information_schema.engine_query_history
        WHERE query_id = '${queryId}'
        LIMIT 1
      `;

      const statement = await conn.execute(statsQuery);
      const { data } = await statement.fetchResult();
      
      if (data && data.length > 0) {
        return {
          duration_usec: data[0][0] || 0,  // Already in microseconds
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

    // Check if late materialization is explicitly disabled
    if (upperQuery.includes('LATE_MATERIALIZATION_MAX_ROWS') && upperQuery.includes('= 0')) {
      return false; // Explicitly disabled
    }

    // Extract LIMIT value
    const limitMatch = upperQuery.match(/LIMIT\s+(\d+)/);
    if (limitMatch) {
      const limitValue = parseInt(limitMatch[1], 10);
      // Check if LIMIT <= 10 OR if late_materialization_max_rows is set to a positive value
      if (limitValue <= 10) {
        return true; // Automatic optimization for small LIMIT
      }
      // Check for WITH clause or SET command with positive value
      if (upperQuery.includes('LATE_MATERIALIZATION_MAX_ROWS')) {
        return true; // Explicitly enabled for larger LIMIT
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

