'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Play, History, Lightbulb } from 'lucide-react';
import { QueryHistoryItem } from '@/lib/types';

// Dynamically import Monaco Editor (client-side only)
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface QueryEditorProps {
  onRunQuery: (sql: string) => void;
  isConnected: boolean;
  isRunning: boolean;
  queryHistory: QueryHistoryItem[];
}

export default function QueryEditor({ onRunQuery, isConnected, isRunning, queryHistory }: QueryEditorProps) {
  const [query, setQuery] = useState<string>(
    'SELECT * FROM events ORDER BY timestamp DESC LIMIT 10'
  );
  const [showHistory, setShowHistory] = useState(false);

  const handleRunQuery = () => {
    if (query.trim()) {
      onRunQuery(query);
    }
  };

  const loadHistoryQuery = (historyItem: QueryHistoryItem) => {
    setQuery(historyItem.query);
    setShowHistory(false);
  };

  const tips = [
    'Automatic for LIMIT ≤ 10',
    'Use WITH or SET for larger limits',
    'Best with wide tables (many columns)',
    'Requires ORDER BY + LIMIT',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Main Editor */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">SQL Query Editor</h3>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <History size={16} />
              History ({queryHistory.length})
            </button>
          </div>

          <div className="border border-gray-300 rounded-md overflow-hidden mb-3">
            <Editor
              height="300px"
              defaultLanguage="sql"
              value={query}
              onChange={(value) => setQuery(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          <button
            onClick={handleRunQuery}
            disabled={!isConnected || isRunning || !query.trim()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#EF2F4B] text-white font-semibold rounded-full hover:bg-[#D91A3A] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Play size={18} />
            {isRunning ? 'Executing...' : 'Execute Query'}
          </button>

          {!isConnected && (
            <p className="mt-2 text-sm text-red-600">
              Please connect to Firebolt Cloud first
            </p>
          )}
        </div>

        {/* Query History */}
        {showHistory && queryHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-3">Recent Queries</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {queryHistory.slice().reverse().slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadHistoryQuery(item)}
                  className="p-3 border border-gray-200 rounded hover:border-firebolt-orange hover:bg-orange-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${item.optimized ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.optimized ? 'Optimized' : 'Not optimized'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-700 font-mono overflow-x-auto whitespace-pre-wrap">
                    {item.query.length > 150 ? item.query.substring(0, 150) + '...' : item.query}
                  </pre>
                  {item.error ? (
                    <p className="text-xs text-red-600 mt-1">Error: {item.error}</p>
                  ) : (
                    <div className="flex gap-3 text-xs text-gray-600 mt-1">
                      <span>{item.executionTime.toFixed(2)}s</span>
                      <span>{(item.dataScanned / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>{item.rowCount} rows</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tips Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-4 sticky top-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="text-yellow-600" size={20} />
            <h3 className="font-semibold text-gray-900">Tips</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">Example Queries</h4>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => setQuery('SELECT * FROM events ORDER BY timestamp DESC LIMIT 10')}
                className="w-full text-left p-2 bg-white rounded hover:bg-blue-100 transition-colors"
              >
                Basic top 10
              </button>
              <button
                onClick={() => setQuery('SELECT * FROM events ORDER BY timestamp DESC LIMIT 100\nWITH late_materialization_max_rows = 100')}
                className="w-full text-left p-2 bg-white rounded hover:bg-blue-100 transition-colors"
              >
                Top 100 with config
              </button>
              <button
                onClick={() => setQuery('SET late_materialization_max_rows = 100;\nSELECT * FROM events ORDER BY timestamp DESC LIMIT 100')}
                className="w-full text-left p-2 bg-white rounded hover:bg-blue-100 transition-colors"
              >
                Session config
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

