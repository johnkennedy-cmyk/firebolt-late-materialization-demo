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
  
  const executionTimeData = recentQueries.map((item, index) => {
    // Find if there's a comparison query (optimized vs non-optimized)
    const isOptimized = item.optimized;
    const comparisonQuery = recentQueries.find((q, idx) => 
      idx !== index && q.optimized !== isOptimized && 
      Math.abs(q.rowCount - item.rowCount) < 5 // Similar row counts
    );
    
    let speedup = '';
    if (comparisonQuery && !isOptimized && comparisonQuery.optimized) {
      const multiplier = (item.executionTime / comparisonQuery.executionTime).toFixed(1);
      speedup = ` (${multiplier}x slower)`;
    } else if (comparisonQuery && isOptimized && !comparisonQuery.optimized) {
      const multiplier = (comparisonQuery.executionTime / item.executionTime).toFixed(1);
      speedup = ` (${multiplier}x faster!)`;
    }
    
    return {
      name: `Query ${queryHistory.length - recentQueries.length + index + 1}${speedup}`,
      time: parseFloat(item.executionTime.toFixed(3)),
      fill: item.optimized ? '#22c55e' : '#ef4444',
      optimized: item.optimized,
    };
  });

  const dataScannedData = recentQueries.map((item, index) => {
    const isOptimized = item.optimized;
    const comparisonQuery = recentQueries.find((q, idx) => 
      idx !== index && q.optimized !== isOptimized && 
      Math.abs(q.rowCount - item.rowCount) < 5
    );
    
    let savings = '';
    if (comparisonQuery && !isOptimized && comparisonQuery.optimized) {
      const multiplier = (item.dataScanned / comparisonQuery.dataScanned).toFixed(1);
      savings = ` (${multiplier}x more data)`;
    } else if (comparisonQuery && isOptimized && !comparisonQuery.optimized) {
      const pct = (100 - (item.dataScanned / comparisonQuery.dataScanned * 100)).toFixed(0);
      savings = ` (${pct}% less!)`;
    }
    
    return {
      name: `Query ${queryHistory.length - recentQueries.length + index + 1}${savings}`,
      data: parseFloat((item.dataScanned / (1024 * 1024)).toFixed(2)),
      fill: item.optimized ? '#22c55e' : '#ef4444',
      optimized: item.optimized,
    };
  });

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
        <h4 className="text-sm font-semibold text-gray-700 mb-3">⚡ Execution Time Comparison</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={executionTimeData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11 }} 
              angle={-15}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              label={{ value: 'Seconds', angle: -90, position: 'insideLeft', fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                `${value}s${props.payload.optimized ? ' ⚡ OPTIMIZED' : ' 🐌 BASELINE'}`, 
                'Execution Time'
              ]}
              contentStyle={{ fontSize: 12, backgroundColor: 'rgba(255,255,255,0.95)', border: '2px solid #ddd' }}
            />
            <Bar dataKey="time" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-2 text-xs font-medium">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>✅ Optimized (Late Materialization)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>❌ Baseline (Disabled)</span>
          </div>
        </div>
      </div>

      {/* Data Scanned Chart */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">💾 Data Scanned Comparison</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dataScannedData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11 }} 
              angle={-15}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              label={{ value: 'MB', angle: -90, position: 'insideLeft', fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                `${value} MB${props.payload.optimized ? ' ⚡ PRUNED' : ' 🐘 FULL SCAN'}`, 
                'Data Scanned'
              ]}
              contentStyle={{ fontSize: 12, backgroundColor: 'rgba(255,255,255,0.95)', border: '2px solid #ddd' }}
            />
            <Bar dataKey="data" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-600 text-center mt-3 italic">
          💡 Lower is better! Optimized queries scan dramatically less data.
        </p>
      </div>
    </div>
  );
}

