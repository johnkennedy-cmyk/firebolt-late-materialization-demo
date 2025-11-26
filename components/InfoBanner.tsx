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
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              <strong>Automatic for LIMIT ≤ 10:</strong> No configuration needed! 
              Firebolt 4.28+ automatically optimizes these queries.
            </p>
            <p>
              <strong>For larger limits:</strong> Use <code className="bg-blue-100 px-1 rounded">SET late_materialization_max_rows = 100</code> 
              {' '}or add <code className="bg-blue-100 px-1 rounded">WITH late_materialization_max_rows = 100</code> to your query.
            </p>
            <p>
              <strong>Best results:</strong> Wide tables with many columns, especially with large text fields or JSON.
            </p>
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

