import { NextRequest, NextResponse } from 'next/server';
import { FireboltClient } from '@/lib/firebolt';
import { FireboltCredentials } from '@/lib/types';

// Simple rate limiting (in-memory)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 50; // requests per window
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { query, database, engine, clientId, clientSecret, account } = body;

    // Validate required fields
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!database || !engine || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing required credentials' },
        { status: 400 }
      );
    }

    const credentials: FireboltCredentials = {
      database,
      engine,
      clientId,
      clientSecret,
      account,
    };

    const client = new FireboltClient(credentials);
    const result = await client.executeQuery(query);

    return NextResponse.json({
      success: true,
      result: {
        columns: result.columns,
        rows: result.rows,
        rowCount: result.rowCount,
        executionTime: result.executionTime,
        dataScanned: result.dataScanned,
        optimized: result.optimized,
        timestamp: result.timestamp,
      },
    });
  } catch (error: any) {
    console.error('Query execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Query execution failed' },
      { status: 500 }
    );
  }
}

