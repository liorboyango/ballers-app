/**
 * useCategoryTree
 * Custom React hook that manages the full lifecycle of Yupoo category
 * fetching and selection state.
 *
 * Returns:
 *  - categories: the raw tree from the API
 *  - filteredCategories: filtered by current searchQuery
 *  - selected: Set<string> of selected node IDs
 *  - loading, error, lastFetched
 *  - fetchCategories: manual re-fetch
 *  - toggleNode: toggle a node (and all its descendants)
 *  - selectAll / clearAll
 *  - selectedCount / tooManySelected
 *  - selectedTree: only the selected nodes (for the Review stage)
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { getYupooCategories } from '../services/yupooApi';

// ─── Tree utilities (mirrored from CategoryTree for independence) ─────────────

/** Recursively collect all IDs from a node tree */
function collectIds(node) {
  const ids = [node.id];
  if (Array.isArray(node.subcategories)) {
    node.subcategories.forEach((child) => ids.push(...collectIds(child)));
  }
  return ids;
}

/** Filter tree to nodes matching query, keeping parents of matches */
function filterTree(nodes, query) {
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
 * Build the selected sub-tree for the Review stage.
 * Returns top-level nodes that are selected or have selected children,
 * with only the selected children included.
 */
function buildSelectedTree(nodes, selected) {
  const result = [];
  for (const node of nodes) {
    const selectedChildren = Array.isArray(node.subcategories)
      ? node.subcategories.filter((c) => selected.has(c.id))
      : [];
    if (selected.has(node.id) || selectedChildren.length > 0) {
      result.push({ ...node, subcategories: selectedChildren });
    }
  }
  return result;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param {Object} [options]
 * @param {boolean} [options.autoFetch=true] - Fetch categories on mount
 * @returns {UseCategoryTreeResult}
 */
export function useCategoryTree({ autoFetch = true } = {}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // ── Fetch categories ────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getYupooCategories();
      // Normalize: API may return { categories } or { data: { categories } }
      const cats =
        data?.categories ??
        data?.data?.categories ??
        [];
      setCategories(cats);
      setLastFetched(
        data?.cachedAt ??
        data?.data?.cachedAt ??
        new Date().toISOString()
      );
    } catch (err) {
      const msg =
        err?.message ??
        'Failed to load categories. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchCategories();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Selection handlers ──────────────────────────────────────────────────────

  const allIds = useMemo(() => {
    const ids = new Set();
    categories.forEach((cat) =>
      collectIds(cat).forEach((id) => ids.add(id))
    );
    return ids;
  }, [categories]);

  const toggleNode = useCallback(
    (node) => {
      const ids = collectIds(node);
      setSelected((prev) => {
        const next = new Set(prev);
        const allChecked = ids.every((id) => next.has(id));
        if (allChecked) {
          ids.forEach((id) => next.delete(id));
        } else {
          ids.forEach((id) => next.add(id));
        }
        return next;
      });
    },
    []
  );

  const selectAll = useCallback(() => {
    setSelected(new Set(allIds));
  }, [allIds]);

  const clearAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const setSelectionDirectly = useCallback((newSelected) => {
    setSelected(newSelected);
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────

  const filteredCategories = useMemo(
    () => filterTree(categories, searchQuery),
    [categories, searchQuery]
  );

  const selectedTree = useMemo(
    () => buildSelectedTree(categories, selected),
    [categories, selected]
  );

  const selectedCount = selected.size;
  const tooManySelected = selectedCount > 50;

  return {
    // Raw data
    categories,
    filteredCategories,
    loading,
    error,
    lastFetched,
    // Search
    searchQuery,
    setSearchQuery,
    // Selection
    selected,
    setSelected: setSelectionDirectly,
    toggleNode,
    selectAll,
    clearAll,
    selectedCount,
    tooManySelected,
    selectedTree,
    // Actions
    fetchCategories,
    allIds,
  };
}

export default useCategoryTree;
