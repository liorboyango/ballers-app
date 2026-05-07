/**
 * CrawlProgress
 * Displays the real-time progress of an ongoing supplier crawl import.
 *
 * Enhanced in Task 4 with:
 * - Animated shimmer progress bar during crawl
 * - Elapsed time counter ("Running for X seconds")
 * - Pulsing animated row indicator for in-progress status
 * - Smooth category row transitions
 * - Detailed per-category error messages with expand/collapse
 * - Rich completion summary with icons
 * - Accessible live regions
 *
 * @param {Object} props
 * @param {Object|null} props.result         - Crawl result from API or null while loading
 * @param {boolean}     props.loading        - Whether crawl is still running
 * @param {string|null} props.error          - Top-level error (network / server fail)
 * @param {Array}       props.selectedCategories - Categories that were submitted
 * @param {function}    props.onDone         - Called when user clicks Done
 * @param {function}    props.onViewProducts - Called when user clicks View Products
 * @param {function}    [props.onRetry]      - Called when user clicks Retry Import (shown on failure)
 */
import React, { useMemo, useEffect, useState, useRef } from 'react';

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated spinner used inline for in-progress rows */
function InlineSpinner({ className = '' }) {
  return (
    <svg
      className={`animate-spin text-brand ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/** Status icon for each category row */
function StatusIcon({ status }) {
  if (status === 'done') {
    return (
      <span
        className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0"
        aria-label="Done"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span
        className="w-5 h-5 rounded-full bg-red-100 text-accent-danger flex items-center justify-center flex-shrink-0"
        aria-label="Error"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </span>
    );
  }
  if (status === 'in-progress') {
    return (
      <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center" aria-label="In progress">
        <InlineSpinner className="w-4 h-4" />
      </span>
    );
  }
  // waiting
  return (
    <span
      className="w-5 h-5 rounded-full border-2 border-line flex-shrink-0"
      aria-label="Waiting"
    />
  );
}

/** Animated progress bar — shows shimmer while loading, fills on complete */
function ProgressBar({ progress, loading, hasError }) {
  const barColor = hasError ? 'bg-accent-danger' : 'bg-brand';

  return (
    <div
      className="w-full bg-surface-sunken rounded-full h-2.5 overflow-hidden"
      role="progressbar"
      aria-valuenow={loading ? undefined : Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Import progress"
    >
      {loading ? (
        /* Shimmer animation while import is running */
        <div className="h-2.5 w-full relative overflow-hidden">
          <div className={`h-full ${barColor} opacity-30 absolute inset-0`} />
          <div className="h-full absolute inset-0 crawl-progress-shimmer" />
        </div>
      ) : (
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      )}
    </div>
  );
}

/** Elapsed time display — ticks every second while loading is true */
function ElapsedTimer({ running }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now();
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  if (!running) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const label = mins > 0
    ? `${mins}m ${secs}s`
    : `${secs}s`;

  return (
    <span className="text-xs text-ink-faint" aria-live="off">
      Running for {label}
    </span>
  );
}

/** Single category row in the progress list */
function CategoryRow({ cat, status, catErrors, loading }) {
  const [expanded, setExpanded] = useState(false);
  const hasErrors = catErrors.length > 0;

  return (
    <div
      className={`px-4 py-2.5 transition-colors ${
        status === 'in-progress'
          ? 'bg-brand-50/30'
          : status === 'error'
          ? 'bg-red-50/50'
          : status === 'done'
          ? 'bg-green-50/30'
          : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <StatusIcon status={status} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {cat.parentName && (
              <span className="text-xs text-ink-faint">{cat.parentName} /</span>
            )}
            <span
              className={`text-sm font-medium truncate ${
                status === 'in-progress' ? 'text-brand' : 'text-ink'
              }`}
            >
              {cat.name}
            </span>
          </div>

          {status === 'in-progress' && (
            <p className="text-xs text-brand-600 animate-pulse mt-0.5">
              Importing products…
            </p>
          )}

          {hasErrors && expanded && (
            <ul className="mt-1.5 space-y-0.5">
              {catErrors.map((e, i) => (
                <li key={i} className="text-xs text-accent-danger">
                  {e.message || e.error || 'Unknown error'}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {status === 'done' && !loading && (
            <span className="text-xs text-green-600 font-medium">done</span>
          )}
          {status === 'in-progress' && (
            <span className="text-xs text-brand font-medium">importing…</span>
          )}
          {status === 'error' && (
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              className="text-xs text-accent-danger font-medium hover:underline focus:outline-none focus-visible:underline"
              aria-expanded={expanded}
            >
              {catErrors.length} error{catErrors.length !== 1 ? 's' : ''}
              <span className="ml-0.5" aria-hidden="true">
                {expanded ? ' ▲' : ' ▼'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CrawlProgress({
  result,
  loading,
  error,
  selectedCategories = [],
  onDone,
  onViewProducts,
  onRetry,
}) {
  // Flatten selected categories (top-level + subcategories) for display
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

  // Result stats
  const created = result?.created ?? 0;
  const skipped = result?.skipped ?? 0;
  const errors = Array.isArray(result?.errors) ? result.errors : [];
  const errorCount = errors.length;

  /**
   * Determine the display status of each category row.
   * Since the backend runs synchronously (no per-step streaming), all rows
   * show as "in-progress" during the request and resolve together at the end.
   */
  const getCategoryStatus = (cat) => {
    if (loading) return 'in-progress';
    if (!result && !error) return 'waiting';
    const catErrors = errors.filter(
      (e) => e.category === cat.name || e.category === cat.id
    );
    if (catErrors.length > 0) return 'error';
    return 'done';
  };

  // Progress percentage: 0 while loading, 100 when done
  const doneCount = loading ? 0 : total;
  const progress = total > 0 ? (loading ? 40 : 100) : 0; // 40% while shimmer

  const isComplete = !loading && (result !== null || error !== null);
  const isSuccess = isComplete && !error && created > 0;
  const isPartial = isComplete && !error && errorCount > 0;
  const hasTopError = !!error;

  return (
    <div className="space-y-5">
      {/* ── Progress header ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-ink">
            {loading
              ? 'Importing Products…'
              : hasTopError
              ? 'Import Failed'
              : isComplete
              ? 'Import Complete'
              : 'Ready to Import'}
          </span>
          <div className="flex items-center gap-3">
            <ElapsedTimer running={loading} />
            <span className="text-sm text-ink-muted" aria-live="polite" aria-atomic="true">
              {loading
                ? `0 / ${total} categories`
                : `${doneCount} / ${total} categories`}
            </span>
          </div>
        </div>

        <ProgressBar
          progress={progress}
          loading={loading}
          hasError={hasTopError}
        />

        {loading && (
          <p
            className="text-xs text-ink-muted mt-1.5 animate-pulse"
            aria-live="polite"
          >
            Fetching albums, parsing products, and uploading images — this may
            take a few minutes.
          </p>
        )}
      </div>

      {/* ── Top-level error alert ── */}
      {hasTopError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-lg text-accent-danger"
        >
          <svg
            className="w-5 h-5 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold">Import failed</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Category list ── */}
      {total > 0 && (
        <div className="border border-line rounded-xl overflow-hidden">
          <div
            className="divide-y divide-line max-h-72 overflow-y-auto"
            role="list"
            aria-label="Category import status"
            aria-live="polite"
            aria-atomic="false"
          >
            {allCategories.map((cat) => {
              const status = getCategoryStatus(cat);
              const catErrors = errors.filter(
                (e) => e.category === cat.name || e.category === cat.id
              );
              return (
                <div key={cat.id} role="listitem">
                  <CategoryRow
                    cat={cat}
                    status={status}
                    catErrors={catErrors}
                    loading={loading}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Summary stats (shown after completion) ── */}
      {isComplete && (
        <div
          className={`flex items-stretch gap-0 rounded-xl border overflow-hidden ${
            hasTopError
              ? 'bg-red-50 border-red-200'
              : isPartial
              ? 'bg-amber-50 border-amber-200'
              : 'bg-green-50 border-green-200'
          }`}
          role="status"
          aria-label="Import summary"
        >
          {/* Created */}
          <div className="flex-1 text-center px-4 py-4">
            <p className="text-2xl font-bold text-green-700">
              {created}
            </p>
            <p className="text-xs text-ink-muted mt-1">Created</p>
          </div>

          <div className="w-px bg-line" />

          {/* Skipped */}
          <div className="flex-1 text-center px-4 py-4">
            <p className="text-2xl font-bold text-ink-soft">{skipped}</p>
            <p className="text-xs text-ink-muted mt-1">Skipped</p>
          </div>

          <div className="w-px bg-line" />

          {/* Errors */}
          <div className="flex-1 text-center px-4 py-4">
            <p
              className={`text-2xl font-bold ${
                errorCount > 0 ? 'text-accent-danger' : 'text-ink-faint'
              }`}
            >
              {errorCount}
            </p>
            <p className="text-xs text-ink-muted mt-1">Errors</p>
          </div>
        </div>
      )}

      {/* ── Success banner ── */}
      {isSuccess && (
        <div
          role="status"
          className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl crawl-result-enter"
        >
          <span className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-green-800">
              Import successful!
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              {created} product{created !== 1 ? 's' : ''} added to your store.
              {skipped > 0 &&
                ` ${skipped} duplicate${skipped !== 1 ? 's' : ''} skipped.`}
            </p>
          </div>
        </div>
      )}

      {/* ── Partial success banner ── */}
      {isPartial && !hasTopError && (
        <div
          role="status"
          className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl crawl-result-enter"
        >
          <span className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Import completed with errors
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {created} product{created !== 1 ? 's' : ''} created,{' '}
              {errorCount} error{errorCount !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex justify-end gap-3 pt-1">
        {isComplete && created > 0 && (
          <button
            type="button"
            onClick={onViewProducts}
            className="btn-secondary py-2 px-4 text-sm"
          >
            View Products
          </button>
        )}
        {isComplete && onRetry && (hasTopError || isPartial) && (
          <button
            type="button"
            onClick={onRetry}
            className="btn-secondary py-2 px-4 text-sm flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-4M20 14a8 8 0 01-14 4"
              />
            </svg>
            Retry Import
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
              <InlineSpinner className="w-4 h-4" />
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
