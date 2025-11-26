import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials } from '@/lib/firebolt';
import { FireboltCredentials } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { database, engine, clientId, clientSecret, account } = body;

    // Validate required fields
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

    const result = await validateCredentials(credentials);

    if (result.valid) {
      return NextResponse.json({ 
        success: true, 
        message: 'Connection successful' 
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Connection failed' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

