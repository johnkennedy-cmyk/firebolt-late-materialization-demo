'use client';

import { Info } from 'lucide-react';

export default function InfoBanner() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Info className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-2">
            About Late Materialization
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>🎯 Automatic for LIMIT ≤ 10:</strong> No configuration needed! 
              Firebolt 4.28+ automatically optimizes these queries.
            </p>
            <p>
              <strong>🔬 TWO CONDITIONS for maximum benefit (both must be met):</strong>
            </p>
            <ol className="list-decimal list-inside pl-4 space-y-1">
              <li><strong>Large Column Size:</strong> Wide tables with large TEXT/JSON columns (thousands of characters)</li>
              <li><strong>High Row Count Difference:</strong> Many rows scanned, but few returned (millions → 10)</li>
            </ol>
            <p>
              <strong>✅ Best case:</strong> 100M rows, 105 columns, LIMIT 10 = <span className="font-bold text-green-700">32x faster</span>, 58x less data
            </p>
            <p>
              <strong>⚠️ No benefit:</strong> Small columns (2-3 chars) OR pre-filtered data (WHERE reduces to &lt;100 rows)
            </p>
            <p>
              <strong>For larger limits:</strong> Use <code className="bg-blue-100 px-1 rounded">WITH late_materialization_max_rows = 100</code>
            </p>
            <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded">
              <p className="font-bold text-yellow-900 mb-1">⚠️ CACHE WARNING - Testing Order Matters!</p>
              <p className="text-xs text-yellow-900">
                Firebolt caches query results. If you run queries out of order or repeatedly, 
                cached results will make ALL queries fast, hiding the optimization benefit. 
                <strong className="text-yellow-950"> Always run DISABLED first (cold cache), then OPTIMIZED second.</strong>
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-sm">
            <a 
              href="https://www.firebolt.io/blog/pruning-even-more-data-with-late-materialization"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Read the blog post →
            </a>
            <a 
              href="https://docs.firebolt.io/performance-and-observability/query-planning/late-materialization"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View documentation →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

