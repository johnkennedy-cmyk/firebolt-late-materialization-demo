'use client';

import { useState, useEffect, useRef } from 'react';
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
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleConnectionChange = (creds: FireboltCredentials | null, status: ConnectionStatus) => {
    setCredentials(creds);
    setConnectionStatus(status);
  };

  // Auto-scroll to results when query completes
  useEffect(() => {
    if ((queryResult || queryError) && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100); // Small delay to ensure DOM is updated
    }
  }, [queryResult, queryError]);

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
          cacheDisabled: data.result.cacheDisabled,
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
    <main className="min-h-screen bg-firebolt-lightGray">
      {/* Hero Section - Firebolt Style */}
      <div className="bg-white border-b border-gray-200 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#EF2F4B"/>
              <path d="M8 8h8v8H8z" fill="white"/>
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Experience Firebolt&apos;s<br />Late Materialization
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            30x faster top-K queries. Automatic. No configuration.
          </p>
          <a
            href="https://www.firebolt.io/blog/pruning-even-more-data-with-late-materialization"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#EF2F4B] hover:bg-[#D91A3A] text-white font-semibold px-8 py-4 rounded-full transition-colors duration-200"
          >
            Read the full blog post
            <ExternalLink size={18} />
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Three-Step Flow */}
        <div className="mb-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-firebolt-red text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Connect to Firebolt Cloud</h3>
              <p className="text-sm text-gray-600">
                Enter your database credentials to get started
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-firebolt-red text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Run Example Queries</h3>
              <p className="text-sm text-gray-600">
                Try pre-built examples or write your own SQL
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-firebolt-red text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">See Performance Improvements</h3>
              <p className="text-sm text-gray-600">
                Watch real-time metrics and optimizations
              </p>
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
            <div className="mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 inline-flex">
                <button
                  onClick={() => setActiveTab('prebuilt')}
                  className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === 'prebuilt'
                      ? 'bg-[#EF2F4B] text-white shadow-md hover:bg-[#D91A3A]'
                      : 'text-gray-900 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Pre-built Examples
                </button>
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === 'editor'
                      ? 'bg-[#EF2F4B] text-white shadow-md hover:bg-[#D91A3A]'
                      : 'text-gray-900 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Query Editor
                </button>
              </div>
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
            <div ref={resultsRef} className="mb-6">
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
              <h3 className="font-semibold text-[#EF2F4B] mb-2">
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
              <h3 className="font-semibold text-[#EF2F4B] mb-2">
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
              <h3 className="font-semibold text-[#EF2F4B] mb-2">
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

