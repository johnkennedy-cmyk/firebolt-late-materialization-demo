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

  const getBadgeStyles = (color: 'green' | 'gray' | 'blue') => {
    const styles = {
      green: 'bg-green-100 text-green-800 border-green-300',
      gray: 'bg-gray-100 text-gray-800 border-gray-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
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
    <div className="space-y-4">
      {prebuiltQueries.map((query) => (
        <div
          key={query.id}
          className={`border rounded-lg p-4 transition-all ${
            selectedQuery === query.id ? 'border-firebolt-orange shadow-md' : 'border-gray-200 hover:border-gray-300'
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
            className="flex items-center gap-2 px-4 py-2 bg-firebolt-orange text-white rounded-md hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Play size={16} />
            {isRunning && selectedQuery === query.id ? 'Running...' : 'Run Query'}
          </button>
        </div>
      ))}
    </div>
  );
}

