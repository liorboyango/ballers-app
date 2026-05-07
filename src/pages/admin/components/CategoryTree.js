/**
 * CategoryTree
 * Renders the full Yupoo category tree with search, expand/collapse all,
 * select all / clear all, and selection summary.
 *
 * @param {Object} props
 * @param {Object[]} props.categories - Flat-top category array (each may have subcategories)
 * @param {Set<string>} props.selected - Set of selected category IDs
 * @param {function} props.onSelectionChange - (newSelected: Set<string>) => void
 * @param {boolean} [props.loading] - Show skeleton state
 * @param {string|null} [props.error] - Error message
 * @param {function} [props.onRefresh] - Callback to re-fetch categories
 * @param {string|null} [props.lastFetched] - ISO timestamp of last fetch
 */
import React, { useState, useCallback, useMemo } from 'react';
import CategoryTreeNode from './CategoryTreeNode';

/** Collect all IDs from a node tree (node + all descendants) */
const collectIds = (node) => {
  const ids = [node.id];
  if (Array.isArray(node.subcategories)) {
    node.subcategories.forEach((child) => {
      ids.push(...collectIds(child));
    });
  }
  return ids;
};

/** Filter tree by search query — keeps parents of matching nodes */
const filterTree = (nodes, query) => {
  if (!query || !query.trim()) return nodes;
  const q = query.toLowerCase();
  return nodes.reduce((acc, node) => {
    const nameMatch = node.name.toLowerCase().includes(q);
    const filteredChildren = filterTree(node.subcategories || [], query);
    if (nameMatch || filteredChildren.length > 0) {
      acc.push({ ...node, subcategories: filteredChildren });
    }
    return acc;
  }, []);
};

/** Count total selected leaf/parent nodes */
const countSelected = (selected) => selected.size;

function SkeletonRow({ depth = 0 }) {
  return (
    <div className="flex items-center gap-2 py-2 px-2" style={{ paddingLeft: depth * 16 + 8 }}>
      <div className="w-4 h-4 rounded skeleton" />
      <div className="w-4 h-4 rounded skeleton" />
      <div className="h-3.5 rounded skeleton flex-1" style={{ maxWidth: `${80 - depth * 10}%` }} />
    </div>
  );
}

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

  const filteredCategories = useMemo(
    () => filterTree(categories, searchQuery),
    [categories, searchQuery]
  );

  const allIds = useMemo(() => {
    const ids = new Set();
    categories.forEach((cat) => collectIds(cat).forEach((id) => ids.add(id)));
    return ids;
  }, [categories]);

  const selectedCount = countSelected(selected);
  const tooManySelected = selectedCount > 50;

  const handleToggle = useCallback(
    (node) => {
      const ids = collectIds(node);
      const newSelected = new Set(selected);
      // If the parent is selected, deselect all; otherwise select all
      const allSelected = ids.every((id) => newSelected.has(id));
      if (allSelected) {
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
    // Trigger re-render by toggling search with space, or just use a key
    // Expand all is handled at node level via searchQuery effect
    // Here we use a trick: temporarily set a non-empty search then clear
  }, []);

  const relativeTime = useMemo(() => {
    if (!lastFetched) return null;
    const diff = Date.now() - new Date(lastFetched).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(lastFetched).toLocaleDateString();
  }, [lastFetched]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">Browse Categories</h3>
          {relativeTime && (
            <p className="text-xs text-ink-faint mt-0.5">Last fetched: {relativeTime}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-60"
          aria-label="Refresh categories"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
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

      {/* Search + Expand All */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories…"
            className="input-field pl-9 text-sm w-full"
            aria-label="Search categories"
          />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 mb-3 bg-red-50 border border-red-200 rounded-lg text-accent-danger text-sm"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="flex-1">{error}</span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="underline font-semibold ml-auto hover:no-underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Too many selected warning */}
      {tooManySelected && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 mb-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>
            <strong>{selectedCount} categories</strong> selected — import may take 5+ minutes.
          </span>
        </div>
      )}

      {/* Tree */}
      <div
        className="flex-1 overflow-y-auto border border-line rounded-lg bg-white"
        role="tree"
        aria-label="Yupoo category tree"
        aria-multiselectable="true"
      >
        {loading && categories.length === 0 ? (
          <div className="p-2 space-y-1">
            {[...Array(6)].map((_, i) => (
              <SkeletonRow key={i} depth={i % 3 === 0 ? 0 : 1} />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-10 text-center text-ink-muted text-sm">
            {searchQuery ? 'No categories match your search.' : 'No categories available.'}
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer: selection summary + actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
        <span className="text-sm text-ink-soft">
          {selectedCount > 0 ? (
            <span>
              <span className="font-semibold text-ink">{selectedCount}</span> categor{selectedCount === 1 ? 'y' : 'ies'} selected
            </span>
          ) : (
            'No categories selected'
          )}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={loading || allIds.size === 0}
            className="text-xs text-brand font-semibold hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Select All
          </button>
          <span className="text-ink-faint">·</span>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={selectedCount === 0}
            className="text-xs text-ink-soft font-semibold hover:text-ink hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryTree;
