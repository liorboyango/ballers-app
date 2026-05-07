/**
 * CategoryTree
 * Renders the full supplier category tree with:
 * - Real-time search filter with text highlighting
 * - Expand All / Collapse All controls
 * - Select All / Clear All actions
 * - Loading skeleton state (while fetching)
 * - Error banner with Retry action
 * - Too-many-selected warning (>50 categories)
 * - Last-fetched timestamp display
 * - Accessible ARIA tree role markup
 *
 * @param {Object} props
 * @param {Object[]} props.categories - Top-level category array (each may have subcategories)
 * @param {Set<string>} props.selected - Set of selected category IDs
 * @param {function} props.onSelectionChange - (newSelected: Set<string>) => void
 * @param {boolean} [props.loading=false] - Show skeleton state
 * @param {string|null} [props.error=null] - Error message to display
 * @param {function} [props.onRefresh] - Callback to re-fetch categories
 * @param {string|null} [props.lastFetched=null] - ISO timestamp of last successful fetch
 */
import React, { useState, useCallback, useMemo } from 'react';
import CategoryTreeNode from './CategoryTreeNode';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Recursively collect all IDs from a node tree (node + all descendants).
 * @param {Object} node
 * @returns {string[]}
 */
export function collectIds(node) {
  const ids = [node.id];
  if (Array.isArray(node.subcategories)) {
    node.subcategories.forEach((child) => {
      ids.push(...collectIds(child));
    });
  }
  return ids;
}

/**
 * Filter tree by search query — keeps parents of matching nodes.
 * @param {Object[]} nodes
 * @param {string} query
 * @returns {Object[]}
 */
export function filterTree(nodes, query) {
  if (!query || !query.trim()) return nodes;
  const q = query.toLowerCase().trim();
  return nodes.reduce((acc, node) => {
    const nameMatch = node.name.toLowerCase().includes(q);
    const filteredChildren = filterTree(node.subcategories || [], query);
    if (nameMatch || filteredChildren.length > 0) {
      acc.push({ ...node, subcategories: filteredChildren });
    }
    return acc;
  }, []);
}

/**
 * Format an ISO timestamp into a human-readable relative label.
 * @param {string} isoString
 * @returns {string}
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return null;
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(isoString).toLocaleDateString();
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

/** Single skeleton row used while categories are loading */
function SkeletonRow({ depth = 0, widthPct = 70 }) {
  return (
    <div
      className="flex items-center gap-2 py-2 px-2"
      style={{ paddingLeft: depth * 16 + 8 }}
      aria-hidden="true"
    >
      <div className="w-4 h-4 rounded skeleton" />
      <div className="w-4 h-4 rounded skeleton" />
      <div
        className="h-3.5 rounded skeleton"
        style={{ width: `${widthPct}%` }}
      />
    </div>
  );
}

/** Full skeleton block shown while the first fetch is in progress */
function LoadingSkeleton() {
  return (
    <div className="p-2 space-y-1" aria-label="Loading categories" aria-busy="true">
      <SkeletonRow depth={0} widthPct={65} />
      <SkeletonRow depth={1} widthPct={50} />
      <SkeletonRow depth={1} widthPct={55} />
      <SkeletonRow depth={0} widthPct={70} />
      <SkeletonRow depth={1} widthPct={45} />
      <SkeletonRow depth={0} widthPct={60} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CategoryTree({
  categories = [],
  selected,
  onSelectionChange,
  loading = false,
  error = null,
  onRefresh,
  lastFetched = null,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [forceExpanded, setForceExpanded] = useState(false);

  // Filtered tree based on search query
  const filteredCategories = useMemo(
    () => filterTree(categories, searchQuery),
    [categories, searchQuery]
  );

  // All IDs in the tree (for select-all)
  const allIds = useMemo(() => {
    const ids = new Set();
    categories.forEach((cat) =>
      collectIds(cat).forEach((id) => ids.add(id))
    );
    return ids;
  }, [categories]);

  const selectedCount = selected.size;
  const tooManySelected = selectedCount > 50;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  /**
   * Toggle a node and all its descendants.
   * If all are already selected → deselect all; else → select all.
   */
  const handleToggle = useCallback(
    (node) => {
      const ids = collectIds(node);
      const newSelected = new Set(selected);
      const allAlreadySelected = ids.every((id) => newSelected.has(id));
      if (allAlreadySelected) {
        ids.forEach((id) => newSelected.delete(id));
      } else {
        ids.forEach((id) => newSelected.add(id));
      }
      onSelectionChange(newSelected);
    },
    [selected, onSelectionChange]
  );

  const handleSelectAll = useCallback(() => {
    onSelectionChange(new Set(allIds));
  }, [allIds, onSelectionChange]);

  const handleClearAll = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  const handleExpandAll = useCallback(() => {
    setForceExpanded(true);
    // Allow nodes to react to forceExpanded, then release control
    // so individual nodes can still be collapsed afterwards.
    setTimeout(() => setForceExpanded(false), 100);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Relative time label for the last-fetched timestamp
  const relativeTime = useMemo(
    () => formatRelativeTime(lastFetched),
    [lastFetched]
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full gap-3">
      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">Browse Categories</h3>
          {relativeTime && !loading && (
            <p className="text-xs text-ink-faint mt-0.5">
              Last fetched: {relativeTime}
            </p>
          )}
          {loading && categories.length === 0 && (
            <p className="text-xs text-ink-faint mt-0.5">Fetching categories…</p>
          )}
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-60 flex-shrink-0"
          aria-label="Refresh categories"
        >
          <svg
            className={`w-3.5 h-3.5 ${
              loading ? 'animate-spin' : ''
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Search + Expand All ── */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search categories…"
            className="input-field pl-9 pr-8 text-sm w-full"
            aria-label="Search categories"
            aria-controls="category-tree-list"
          />
          {/* Clear button */}
          {searchQuery && (
            <button
              type="button"
              onClick={handleSearchClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
              aria-label="Clear search"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Expand All button */}
        <button
          type="button"
          onClick={handleExpandAll}
          disabled={loading || categories.length === 0}
          className="btn-secondary py-1.5 px-3 text-xs flex-shrink-0 disabled:opacity-50"
          aria-label="Expand all categories"
        >
          Expand All
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          role="alert"
          className={
            'flex items-center gap-2 p-3 ' +
            'bg-red-50 border border-red-200 rounded-lg ' +
            'text-accent-danger text-sm'
          }
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="flex-1">{error}</span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="underline font-semibold ml-auto hover:no-underline flex-shrink-0"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* ── Too-many-selected warning ── */}
      {tooManySelected && (
        <div
          role="status"
          aria-live="polite"
          className={
            'flex items-center gap-2 p-3 ' +
            'bg-amber-50 border border-amber-200 rounded-lg ' +
            'text-amber-700 text-sm'
          }
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <span>
            <strong>{selectedCount} categories</strong> selected — import may
            take 5+ minutes.
          </span>
        </div>
      )}

      {/* ── Tree list ── */}
      <div
        id="category-tree-list"
        className="flex-1 overflow-y-auto border border-line rounded-lg bg-white min-h-[200px]"
        role="tree"
        aria-label="Supplier category tree"
        aria-multiselectable="true"
        aria-busy={loading}
      >
        {loading && categories.length === 0 ? (
          <LoadingSkeleton />
        ) : filteredCategories.length === 0 ? (
          <div className="py-10 text-center text-ink-muted text-sm px-4">
            {searchQuery
              ? `No categories match "${searchQuery}".`
              : 'No categories available. Click Refresh to try again.'}
          </div>
        ) : (
          <div className="p-1">
            {filteredCategories.map((cat) => (
              <CategoryTreeNode
                key={cat.id}
                node={cat}
                selected={selected}
                onToggle={handleToggle}
                searchQuery={searchQuery}
                depth={0}
                forceExpanded={forceExpanded}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer: selection summary + actions ── */}
      <div className="flex items-center justify-between pt-2 border-t border-line">
        <span className="text-sm text-ink-soft" aria-live="polite">
          {selectedCount > 0 ? (
            <>
              <span className="font-semibold text-ink">{selectedCount}</span>{' '}
              categor{selectedCount === 1 ? 'y' : 'ies'} selected
            </>
          ) : (
            'No categories selected'
          )}
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={loading || allIds.size === 0}
            className={
              'text-xs font-semibold transition-colors ' +
              'text-brand hover:text-brand-dark hover:underline ' +
              'disabled:opacity-40 disabled:cursor-not-allowed'
            }
          >
            Select All
          </button>
          <span className="text-ink-faint text-xs" aria-hidden="true">
            ·
          </span>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={selectedCount === 0}
            className={
              'text-xs font-semibold transition-colors ' +
              'text-ink-soft hover:text-ink hover:underline ' +
              'disabled:opacity-40 disabled:cursor-not-allowed'
            }
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryTree;
