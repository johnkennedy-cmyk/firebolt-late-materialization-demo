'use client';

import { useState } from 'react';
import { Play, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { PrebuiltQuery } from '@/lib/types';
import { prebuiltQueries } from '@/lib/prebuiltQueries';

interface PrebuiltQueriesProps {
  onRunQuery: (sql: string) => void;
  isConnected: boolean;
  isRunning: boolean;
}

export default function PrebuiltQueries({ onRunQuery, isConnected, isRunning }: PrebuiltQueriesProps) {
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);

  const handleRunQuery = (query: PrebuiltQuery) => {
    setSelectedQuery(query.id);
    onRunQuery(query.sql);
  };

  const getBadgeStyles = (color: 'green' | 'gray' | 'blue' | 'red') => {
    const styles = {
      green: 'bg-green-100 text-green-800 border-green-300',
      gray: 'bg-gray-100 text-gray-800 border-gray-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      red: 'bg-red-100 text-red-800 border-red-300 font-bold',
    };
    return styles[color];
  };

  const getBadgeIcon = (optimized: boolean) => {
    if (optimized) {
      return <CheckCircle2 size={14} />;
    }
    return <AlertCircle size={14} />;
  };

  return (
    <div className="space-y-6">
      {/* Quick Comparison Callout - ENHANCED WITH CACHE WARNING */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border-4 border-red-500 rounded-lg p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="text-5xl">⚠️</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-red-900 mb-3">
              🎯 CRITICAL: Follow This Order for Accurate Results!
            </h3>
            <p className="text-base text-red-800 mb-4 font-bold bg-red-100 p-2 rounded border-2 border-red-400">
              ⚡ Running queries out of order will show cached results and hide the performance difference!
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-red-50 p-4 rounded-lg border-4 border-red-500 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl font-black text-red-700 bg-white px-3 py-1 rounded-full border-2 border-red-600">1</span>
                  <p className="text-lg font-black text-red-900">FIRST: BASELINE</p>
                </div>
                <p className="text-sm text-red-700 mb-2 font-semibold">Scroll down and click:</p>
                <p className="text-base text-red-900 font-bold bg-white p-2 rounded border-2 border-red-400">&quot;❌ DISABLED: Events Top 10&quot;</p>
                <p className="text-xs text-red-700 mt-2 italic">This runs WITHOUT optimization (cold cache)</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-4 border-green-500 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl font-black text-green-700 bg-white px-3 py-1 rounded-full border-2 border-green-600">2</span>
                  <p className="text-lg font-black text-green-900">THEN: OPTIMIZED</p>
                </div>
                <p className="text-sm text-green-700 mb-2 font-semibold">After baseline completes, click:</p>
                <p className="text-base text-green-900 font-bold bg-white p-2 rounded border-2 border-green-400">&quot;✅ OPTIMIZED: Events Top 10&quot;</p>
                <p className="text-xs text-green-700 mt-2 italic">Watch the 4-10x speedup appear!</p>
              </div>
            </div>
            <div className="bg-yellow-50 border-4 border-yellow-500 rounded-lg p-4 mb-3">
              <p className="text-sm text-yellow-900 font-bold mb-2">🔥 WHY ORDER MATTERS (Cache Effect):</p>
              <ul className="text-xs text-yellow-900 space-y-1 list-disc list-inside">
                <li><strong>Running OPTIMIZED first:</strong> Caches the data, making DISABLED artificially fast (hides the benefit)</li>
                <li><strong>Running DISABLED first:</strong> Cold cache = real baseline → Then OPTIMIZED shows true speedup</li>
                <li><strong>If results look similar:</strong> You hit cached data. Clear cache and retry in correct order.</li>
              </ul>
            </div>
            <div className="bg-purple-50 border-3 border-purple-500 rounded-lg p-4">
              <p className="text-sm text-purple-900 font-bold mb-2">🔄 TO CLEAR CACHE & TEST AGAIN:</p>
              <ol className="text-xs text-purple-900 space-y-1 list-decimal list-inside">
                <li>Wait 5-10 minutes for Firebolt&apos;s cache to expire, OR</li>
                <li>Run a completely different query (like &quot;Small Columns&quot; below), THEN</li>
                <li>Repeat: DISABLED first → OPTIMIZED second</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {prebuiltQueries.map((query, index) => (
        <div
          key={query.id}
          className={`border rounded-lg p-4 transition-all ${
            query.id === 'events-top-10-disabled' ? 'border-4 border-red-500 bg-red-50 shadow-2xl' :
            query.id === 'events-top-10-optimized' ? 'border-4 border-green-500 bg-green-50 shadow-2xl' :
            selectedQuery === query.id ? 'border-firebolt-red shadow-md' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{query.title}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${getBadgeStyles(query.badgeColor)}`}>
                  {getBadgeIcon(query.optimized)}
                  {query.badge}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{query.description}</p>
              <p className="text-xs text-gray-500 italic">{query.useCase}</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-md p-3 mb-3 overflow-x-auto">
            <pre className="text-sm text-gray-100 font-mono whitespace-pre">
              {query.sql}
            </pre>
          </div>

          {query.expectedMetrics && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
              <div className="flex items-start gap-2">
                <Settings className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-1">Expected Performance (100M rows, 105 columns):</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Before:</span> {query.expectedMetrics.beforeTime}, {query.expectedMetrics.beforeData} scanned
                    </div>
                    <div>
                      <span className="font-medium">After:</span> {query.expectedMetrics.afterTime}, {query.expectedMetrics.afterData} scanned
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => handleRunQuery(query)}
            disabled={!isConnected || isRunning}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-firebolt-red text-white font-semibold rounded-full hover:bg-firebolt-redHover disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Play size={16} />
            {isRunning && selectedQuery === query.id ? 'Running...' : 'Run Query'}
          </button>
        </div>
      ))}
    </div>
  );
}

