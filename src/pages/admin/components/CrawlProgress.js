/**
 * CrawlProgress
 * Displays the real-time progress of an ongoing Yupoo crawl import.
 * Shows a progress bar, per-category status rows, current item info,
 * and a summary of created/skipped/errored products.
 *
 * @param {Object} props
 * @param {Object} props.result - The crawl result object from the API
 * @param {boolean} props.loading - Whether crawl is still in progress
 * @param {string|null} props.error - Top-level error (network / server fail)
 * @param {Array} props.selectedCategories - Categories that were selected
 * @param {function} props.onDone - Called when user clicks Done
 * @param {function} props.onViewProducts - Called when user clicks View Products
 */
import React, { useMemo } from 'react';

function StatusIcon({ status }) {
  if (status === 'done') {
    return (
      <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0" aria-label="Done">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="w-5 h-5 rounded-full bg-red-100 text-accent-danger flex items-center justify-center flex-shrink-0" aria-label="Error">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    );
  }
  if (status === 'in-progress') {
    return (
      <span className="w-5 h-5 flex-shrink-0" aria-label="In progress">
        <svg className="w-5 h-5 animate-spin text-brand" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </span>
    );
  }
  // waiting
  return (
    <span className="w-5 h-5 rounded-full border-2 border-line flex-shrink-0" aria-label="Waiting" />
  );
}

function CrawlProgress({
  result,
  loading,
  error,
  selectedCategories = [],
  onDone,
  onViewProducts,
}) {
  // Flatten selected categories for display
  const allCategories = useMemo(() => {
    const flatten = (nodes, parentName = null) => {
      const out = [];
      for (const node of nodes) {
        out.push({ ...node, parentName });
        if (Array.isArray(node.subcategories) && node.subcategories.length) {
          out.push(...flatten(node.subcategories, node.name));
        }
      }
      return out;
    };
    return flatten(selectedCategories);
  }, [selectedCategories]);

  const total = allCategories.length;
  const created = result?.created ?? 0;
  const skipped = result?.skipped ?? 0;
  const errors = result?.errors ?? [];
  const errorCount = errors.length;

  // Determine which categories completed based on result errors/successes
  // Since we don't have per-category progress from API (single POST), show
  // either loading spinner for all (in-progress) or final state.
  const getCategoryStatus = (cat) => {
    if (loading) return 'in-progress';
    if (!result && !error) return 'waiting';
    const catErrors = errors.filter(
      (e) => e.category === cat.name || e.category === cat.id
    );
    if (catErrors.length > 0) return 'error';
    return 'done';
  };

  const doneCount = loading ? 0 : total - errorCount;
  const progress = total > 0 ? (loading ? 0 : 100) : 0;

  const isComplete = !loading && (result || error);

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-ink">
            {loading ? 'Importing Products…' : isComplete ? 'Import Complete' : 'Ready'}
          </span>
          <span className="text-sm text-ink-muted">
            {loading ? `0 / ${total} categories` : `${doneCount} / ${total} categories`}
          </span>
        </div>
        <div className="w-full bg-surface-sunken rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-700
              ${error ? 'bg-accent-danger' : 'bg-brand'}
              ${loading ? 'animate-pulse w-1/3' : ''}`}
            style={!loading ? { width: `${progress}%` } : undefined}
            role="progressbar"
            aria-valuenow={loading ? undefined : progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Top-level error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-accent-danger text-sm"
        >
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Category list */}
      {total > 0 && (
        <div className="border border-line rounded-lg overflow-hidden">
          <div className="divide-y divide-line max-h-64 overflow-y-auto">
            {allCategories.map((cat) => {
              const status = getCategoryStatus(cat);
              const catErrors = errors.filter(
                (e) => e.category === cat.name || e.category === cat.id
              );
              return (
                <div key={cat.id} className="px-4 py-2.5 flex items-start gap-3">
                  <StatusIcon status={status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {cat.parentName && (
                        <span className="text-xs text-ink-faint">{cat.parentName} /</span>
                      )}
                      <span className="text-sm font-medium text-ink truncate">{cat.name}</span>
                    </div>
                    {catErrors.map((e, i) => (
                      <p key={i} className="text-xs text-accent-danger mt-0.5">
                        {e.message || e.error || 'Unknown error'}
                      </p>
                    ))}
                  </div>
                  {status === 'done' && !loading && (
                    <span className="text-xs text-green-600 font-medium flex-shrink-0">done</span>
                  )}
                  {status === 'in-progress' && (
                    <span className="text-xs text-brand font-medium flex-shrink-0">importing…</span>
                  )}
                  {status === 'error' && (
                    <span className="text-xs text-accent-danger font-medium flex-shrink-0">
                      {catErrors.length} error{catErrors.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary stats */}
      {isComplete && (
        <div
          className={`flex items-center gap-6 p-4 rounded-lg border ${
            errorCount > 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">{created}</p>
            <p className="text-xs text-ink-muted mt-0.5">Created</p>
          </div>
          <div className="w-px h-10 bg-line" />
          <div className="text-center">
            <p className="text-2xl font-bold text-ink-soft">{skipped}</p>
            <p className="text-xs text-ink-muted mt-0.5">Skipped</p>
          </div>
          <div className="w-px h-10 bg-line" />
          <div className="text-center">
            <p className={`text-2xl font-bold ${errorCount > 0 ? 'text-accent-danger' : 'text-ink-faint'}`}>
              {errorCount}
            </p>
            <p className="text-xs text-ink-muted mt-0.5">Errors</p>
          </div>
        </div>
      )}

      {/* Success message */}
      {isComplete && !error && created > 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-700 font-medium">
            Successfully imported {created} product{created !== 1 ? 's' : ''}!
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-2">
        {isComplete && created > 0 && (
          <button
            type="button"
            onClick={onViewProducts}
            className="btn-secondary py-2 px-4 text-sm"
          >
            View Products
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          disabled={loading}
          className="btn-primary py-2 px-4 text-sm disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Importing…
            </span>
          ) : (
            'Done'
          )}
        </button>
      </div>
    </div>
  );
}

export default CrawlProgress;
