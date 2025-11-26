'use client';

import { useState } from 'react';
import { Zap, ExternalLink } from 'lucide-react';
import ConnectionForm from '@/components/ConnectionForm';
import InfoBanner from '@/components/InfoBanner';
import PrebuiltQueries from '@/components/PrebuiltQueries';
import QueryEditor from '@/components/QueryEditor';
import ResultsDisplay from '@/components/ResultsDisplay';
import PerformanceChart from '@/components/PerformanceChart';
import { FireboltCredentials, ConnectionStatus, QueryResult, QueryHistoryItem } from '@/lib/types';

export default function Home() {
  const [credentials, setCredentials] = useState<FireboltCredentials | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false });
  const [activeTab, setActiveTab] = useState<'prebuilt' | 'editor'>('prebuilt');
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);

  const handleConnectionChange = (creds: FireboltCredentials | null, status: ConnectionStatus) => {
    setCredentials(creds);
    setConnectionStatus(status);
  };

  const handleRunQuery = async (sql: string) => {
    if (!credentials || !connectionStatus.connected) {
      setQueryError('Please connect to Firebolt Cloud first');
      return;
    }

    setIsRunning(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: sql,
          ...credentials,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setQueryResult(data.result);
        
        // Add to history
        const historyItem: QueryHistoryItem = {
          id: `query-${Date.now()}`,
          query: sql,
          timestamp: Date.now(),
          executionTime: data.result.executionTime,
          dataScanned: data.result.dataScanned,
          rowCount: data.result.rowCount,
          optimized: data.result.optimized,
        };
        setQueryHistory(prev => [...prev, historyItem]);
      } else {
        const errorMsg = data.error || 'Query execution failed';
        setQueryError(errorMsg);
        
        // Add error to history
        const historyItem: QueryHistoryItem = {
          id: `query-${Date.now()}`,
          query: sql,
          timestamp: Date.now(),
          executionTime: 0,
          dataScanned: 0,
          rowCount: 0,
          optimized: false,
          error: errorMsg,
        };
        setQueryHistory(prev => [...prev, historyItem]);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Network error';
      setQueryError(errorMsg);
      
      const historyItem: QueryHistoryItem = {
        id: `query-${Date.now()}`,
        query: sql,
        timestamp: Date.now(),
        executionTime: 0,
        dataScanned: 0,
        rowCount: 0,
        optimized: false,
        error: errorMsg,
      };
      setQueryHistory(prev => [...prev, historyItem]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearHistory = () => {
    setQueryHistory([]);
    setQueryResult(null);
    setQueryError(null);
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-firebolt-orange to-orange-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Zap size={40} />
            <h1 className="text-4xl font-bold">
              Experience Firebolt&apos;s Late Materialization
            </h1>
          </div>
          <p className="text-xl text-orange-100 mb-4">
            30x faster top-K queries. Automatic. No configuration.
          </p>
          <a
            href="https://www.firebolt.io/blog/pruning-even-more-data-with-late-materialization"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white hover:text-orange-100 underline"
          >
            Read the full blog post
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Three-Step Flow */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-firebolt-orange text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Connect to Firebolt Cloud</h3>
                <p className="text-sm text-gray-600">
                  Enter your database credentials to get started
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-firebolt-orange text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Run Example Queries</h3>
                <p className="text-sm text-gray-600">
                  Try pre-built examples or write your own SQL
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-firebolt-orange text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">See Performance Improvements</h3>
                <p className="text-sm text-gray-600">
                  Watch real-time metrics and optimizations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <InfoBanner />

        {/* Connection Form */}
        <ConnectionForm onConnectionChange={handleConnectionChange} />

        {/* Tabbed Interface */}
        {connectionStatus.connected && (
          <div className="mb-6">
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex gap-4">
                <button
                  onClick={() => setActiveTab('prebuilt')}
                  className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                    activeTab === 'prebuilt'
                      ? 'border-firebolt-orange text-firebolt-orange'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Pre-built Examples
                </button>
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                    activeTab === 'editor'
                      ? 'border-firebolt-orange text-firebolt-orange'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Query Editor
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mb-6">
              {activeTab === 'prebuilt' ? (
                <PrebuiltQueries
                  onRunQuery={handleRunQuery}
                  isConnected={connectionStatus.connected}
                  isRunning={isRunning}
                />
              ) : (
                <QueryEditor
                  onRunQuery={handleRunQuery}
                  isConnected={connectionStatus.connected}
                  isRunning={isRunning}
                  queryHistory={queryHistory}
                />
              )}
            </div>

            {/* Results Display */}
            <div className="mb-6">
              <ResultsDisplay result={queryResult} error={queryError} />
            </div>

            {/* Performance Dashboard */}
            <PerformanceChart 
              queryHistory={queryHistory}
              onClearHistory={handleClearHistory}
            />
          </div>
        )}

        {/* Learn More Section */}
        <div className="mt-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Learn More</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="https://www.firebolt.io/blog/pruning-even-more-data-with-late-materialization"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-firebolt-orange mb-2">
                Engineering Blog →
              </h3>
              <p className="text-sm text-gray-600">
                Deep dive into late materialization implementation, query plan analysis, and edge cases
              </p>
            </a>
            <a
              href="https://docs.firebolt.io/performance-and-observability/query-planning/late-materialization"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-firebolt-orange mb-2">
                Documentation →
              </h3>
              <p className="text-sm text-gray-600">
                Reference for late_materialization_max_rows setting and configuration options
              </p>
            </a>
            <a
              href="https://firebolt.io/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-firebolt-orange mb-2">
                Try Firebolt →
              </h3>
              <p className="text-sm text-gray-600">
                Start with $200 in free credits and experience fast analytics for yourself
              </p>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm">
            Fast analytics shouldn&apos;t require constant engineering investment. 
            Firebolt&apos;s automatic optimizations let your team focus on building products while the system handles performance.
          </p>
          <p className="text-xs mt-4">
            © 2025 Firebolt. MIT License.
          </p>
        </div>
      </footer>
    </main>
  );
}

