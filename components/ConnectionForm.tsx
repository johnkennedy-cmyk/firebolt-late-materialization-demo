'use client';

import { useState, useEffect } from 'react';
import { Database, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { FireboltCredentials, ConnectionStatus } from '@/lib/types';

interface ConnectionFormProps {
  onConnectionChange: (credentials: FireboltCredentials | null, status: ConnectionStatus) => void;
}

export default function ConnectionForm({ onConnectionChange }: ConnectionFormProps) {
  const [credentials, setCredentials] = useState<FireboltCredentials>({
    accountName: '',
    database: '',
    engine: '',
    clientId: '',
    clientSecret: '',
  });
  
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false });
  const [testing, setTesting] = useState(false);

  // Load credentials from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('firebolt_credentials');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCredentials(parsed);
        setStatus({ connected: true, database: parsed.database, engine: parsed.engine });
        onConnectionChange(parsed, { connected: true, database: parsed.database, engine: parsed.engine });
      } catch (e) {
        console.error('Failed to parse stored credentials');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: keyof FireboltCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    // Clear connection status when credentials change
    if (status.connected) {
      setStatus({ connected: false });
      onConnectionChange(null, { connected: false });
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatus({ connected: false });

    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newStatus: ConnectionStatus = {
          connected: true,
          database: credentials.database,
          engine: credentials.engine,
        };
        setStatus(newStatus);
        
        // Store credentials securely in sessionStorage
        sessionStorage.setItem('firebolt_credentials', JSON.stringify(credentials));
        
        onConnectionChange(credentials, newStatus);
      } else {
        const errorStatus: ConnectionStatus = {
          connected: false,
          error: data.error || 'Connection failed',
        };
        setStatus(errorStatus);
        onConnectionChange(null, errorStatus);
      }
    } catch (error: any) {
      const errorStatus: ConnectionStatus = {
        connected: false,
        error: error.message || 'Network error',
      };
      setStatus(errorStatus);
      onConnectionChange(null, errorStatus);
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem('firebolt_credentials');
    setStatus({ connected: false });
    onConnectionChange(null, { connected: false });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="text-firebolt-red" size={28} />
        <h2 className="text-2xl font-bold text-gray-900">Connect to Firebolt Cloud</h2>
      </div>

      {status.connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
            <CheckCircle className="text-green-600" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                Connected to {status.database}
              </p>
              <p className="text-xs text-green-700">
                Engine: {status.engine}
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-sm text-green-700 hover:text-green-900 underline"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={credentials.accountName}
                onChange={(e) => handleChange('accountName', e.target.value)}
                placeholder="your_account"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-firebolt-red focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database Name
              </label>
              <input
                type="text"
                value={credentials.database}
                onChange={(e) => handleChange('database', e.target.value)}
                placeholder="your_database"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-firebolt-red focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Engine Name
              </label>
              <input
                type="text"
                value={credentials.engine}
                onChange={(e) => handleChange('engine', e.target.value)}
                placeholder="your_engine"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-firebolt-red focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client ID
              </label>
              <input
                type="text"
                value={credentials.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                placeholder="your_client_id"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-firebolt-red focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret
              </label>
              <input
                type="password"
                value={credentials.clientSecret}
                onChange={(e) => handleChange('clientSecret', e.target.value)}
                placeholder="your_client_secret"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-firebolt-red focus:border-transparent transition-all"
              />
            </div>
          </div>

          {status.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <XCircle className="text-red-600" size={20} />
              <p className="text-sm text-red-800">{status.error}</p>
            </div>
          )}

          <button
            onClick={handleTestConnection}
            disabled={testing || !credentials.accountName || !credentials.database || !credentials.engine || !credentials.clientId || !credentials.clientSecret}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-firebolt-red text-white font-semibold rounded-full hover:bg-firebolt-redHover disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {testing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Testing Connection...
              </>
            ) : (
              <>
                <Zap size={18} />
                Test Connection
              </>
            )}
          </button>

          <p className="text-xs text-gray-500">
            Don&apos;t have a Firebolt account?{' '}
            <a
              href="https://firebolt.io/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-firebolt-orange hover:underline"
            >
              Start with $200 in free credits →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

