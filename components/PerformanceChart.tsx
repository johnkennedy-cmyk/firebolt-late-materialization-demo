'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trash2 } from 'lucide-react';
import { QueryHistoryItem } from '@/lib/types';

interface PerformanceChartProps {
  queryHistory: QueryHistoryItem[];
  onClearHistory: () => void;
}

export default function PerformanceChart({ queryHistory, onClearHistory }: PerformanceChartProps) {
  if (queryHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Dashboard</h3>
        <p className="text-gray-500 text-center py-8">
          Run some queries to see performance comparisons
        </p>
      </div>
    );
  }

  // Prepare data for charts - take last 10 queries
  const recentQueries = queryHistory.slice(-10).filter(q => !q.error);
  
  const executionTimeData = recentQueries.map((item, index) => ({
    name: `Query ${queryHistory.length - 9 + index}`,
    time: parseFloat(item.executionTime.toFixed(3)),
    fill: item.optimized ? '#22c55e' : '#94a3b8',
  }));

  const dataScannedData = recentQueries.map((item, index) => ({
    name: `Query ${queryHistory.length - 9 + index}`,
    data: parseFloat((item.dataScanned / (1024 * 1024)).toFixed(2)),
    fill: item.optimized ? '#22c55e' : '#94a3b8',
  }));

  const totalQueries = queryHistory.length;
  const optimizedQueries = queryHistory.filter(q => q.optimized).length;
  const totalTime = queryHistory.reduce((sum, q) => sum + q.executionTime, 0);
  const avgTime = totalTime / totalQueries;

  // Calculate time saved (assuming 30x improvement for optimized queries)
  const timeSaved = queryHistory
    .filter(q => q.optimized)
    .reduce((sum, q) => sum + (q.executionTime * 29), 0); // 30x faster means we saved 29/30 of what it would have been

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Performance Dashboard</h3>
        <button
          onClick={onClearHistory}
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 size={16} />
          Clear History
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <p className="text-xs text-blue-800 mb-1">Total Queries</p>
          <p className="text-2xl font-bold text-blue-900">{totalQueries}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <p className="text-xs text-green-800 mb-1">Optimized</p>
          <p className="text-2xl font-bold text-green-900">
            {optimizedQueries}
            <span className="text-sm ml-1">
              ({totalQueries > 0 ? Math.round((optimizedQueries / totalQueries) * 100) : 0}%)
            </span>
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg">
          <p className="text-xs text-amber-800 mb-1">Avg Time</p>
          <p className="text-2xl font-bold text-amber-900">{avgTime.toFixed(2)}s</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
          <p className="text-xs text-purple-800 mb-1">Time Saved</p>
          <p className="text-2xl font-bold text-purple-900">~{timeSaved.toFixed(1)}s</p>
        </div>
      </div>

      {/* Execution Time Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Execution Time Comparison</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={executionTimeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: 'Seconds', angle: -90, position: 'insideLeft', fontSize: 12 }} />
            <Tooltip 
              formatter={(value: number) => [`${value}s`, 'Execution Time']}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="time" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Optimized</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>Not Optimized</span>
          </div>
        </div>
      </div>

      {/* Data Scanned Chart */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Scanned Comparison</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dataScannedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: 'MB', angle: -90, position: 'insideLeft', fontSize: 12 }} />
            <Tooltip 
              formatter={(value: number) => [`${value} MB`, 'Data Scanned']}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="data" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

