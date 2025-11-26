'use client';

import { useState } from 'react';
import { Download, CheckCircle, XCircle, Clock, Database, Hash } from 'lucide-react';
import { QueryResult } from '@/lib/types';

interface ResultsDisplayProps {
  result: QueryResult | null;
  error: string | null;
}

export default function ResultsDisplay({ result, error }: ResultsDisplayProps) {
  const [showRows, setShowRows] = useState(100);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="text-red-600" size={24} />
          <h3 className="text-lg font-semibold text-red-900">Query Error</h3>
        </div>
        <p className="text-red-700 bg-red-50 p-4 rounded border border-red-200">
          {error}
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">
          Run a query to see results
        </p>
      </div>
    );
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadCSV = () => {
    if (!result) return;

    const csv = [
      result.columns.join(','),
      ...result.rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firebolt-query-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Performance Metrics Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Query Results</h3>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${
            result.optimized 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-gray-100 text-gray-800 border border-gray-300'
          }`}>
            {result.optimized ? (
              <>
                <CheckCircle size={14} />
                Late Materialization Applied
              </>
            ) : (
              <>
                <XCircle size={14} />
                Not Optimized
              </>
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
          <div className="flex items-start gap-2">
            <Clock className="text-firebolt-red mt-1" size={20} />
            <div>
              <p className="text-xs text-gray-600 font-medium">Execution Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {result.executionTime < 1 
                  ? `${(result.executionTime * 1000).toFixed(0)}ms`
                  : `${result.executionTime.toFixed(2)}s`}
              </p>
              {result.executionTime < 1 && (
                <p className="text-xs text-green-700 font-semibold">⚡ Sub-second!</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Database className="text-firebolt-red mt-1" size={20} />
            <div>
              <p className="text-xs text-gray-600 font-medium">Data Scanned</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatBytes(result.dataScanned)}
              </p>
              {result.optimized && result.dataScanned < 100 * 1024 && (
                <p className="text-xs text-green-700 font-semibold">✓ Minimal!</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Hash className="text-firebolt-red mt-1" size={20} />
            <div>
              <p className="text-xs text-gray-600 font-medium">Rows Returned</p>
              <p className="text-2xl font-bold text-gray-900">
                {result.rowCount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              CSV
            </button>
          </div>
        </div>

        {/* CACHE WARNING when data scanned is 0 */}
        {result.dataScanned === 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-4 border-yellow-500 rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <div className="text-4xl">⚠️</div>
              <div>
                <p className="font-black text-yellow-900 text-lg">
                  CACHED RESULTS - Performance Metrics May Be Misleading!
                </p>
                <p className="text-sm text-yellow-900 font-semibold">
                  This query returned <strong>0 Bytes scanned</strong>, indicating Firebolt served results from cache. 
                  Cached queries are ALWAYS fast regardless of optimization.
                </p>
                <p className="text-xs text-yellow-800 mt-2">
                  🔄 <strong>For accurate comparison:</strong> Wait 5-10 minutes for cache to expire, then run <strong>DISABLED first</strong> → <strong>OPTIMIZED second</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Prominent optimization callout */}
        {result.optimized && result.executionTime < 1 && result.dataScanned > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🚀</div>
              <div>
                <p className="font-bold text-green-900 text-lg">
                  Late Materialization Applied!
                </p>
                <p className="text-sm text-green-800">
                  Query executed in <strong>{(result.executionTime * 1000).toFixed(0)}ms</strong> scanning only <strong>{formatBytes(result.dataScanned)}</strong>.
                  {result.rowCount <= 10 && ' Automatic optimization for LIMIT ≤ 10.'}
                </p>
              </div>
            </div>
            <p className="text-xs text-green-700 mt-2 italic">
              💡 Tip: Run the "DISABLED" version of this query to see the baseline performance and calculate the exact speedup!
            </p>
          </div>
        )}

        {!result.optimized && result.executionTime > 0.1 && result.dataScanned > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-4 border-red-500 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🐌</div>
              <div>
                <p className="font-black text-red-900 text-xl">
                  ✅ STEP 1 COMPLETE: Baseline Established!
                </p>
                <p className="text-sm text-red-800 font-semibold">
                  Query took <strong>{result.executionTime.toFixed(3)}s</strong> scanning <strong>{formatBytes(result.dataScanned)}</strong>.
                  This is the performance WITHOUT late materialization (cold cache).
                </p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-green-50 border-2 border-green-500 rounded">
              <p className="text-sm text-green-900 font-bold">
                👉 NEXT STEP: Now run the &quot;✅ OPTIMIZED: Events Top 10&quot; query above to see the 4-10x speedup!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {result.columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {result.rows.slice(0, showRows).map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                  >
                    {cell === null ? (
                      <span className="text-gray-400 italic">null</span>
                    ) : typeof cell === 'object' ? (
                      JSON.stringify(cell)
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.rows.length > showRows && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowRows(prev => prev + 100)}
            className="px-4 py-2 text-sm text-firebolt-red hover:text-orange-700 underline"
          >
            Show more rows ({result.rows.length - showRows} remaining)
          </button>
        </div>
      )}

      {result.rows.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          Query returned no results
        </p>
      )}
    </div>
  );
}

