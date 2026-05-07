/**
 * Unit tests for the useCategoryTree custom hook.
 *
 * Tests cover:
 * - Initial state
 * - Successful category fetch
 * - Failed category fetch (error state)
 * - Toggle node selection (leaf and parent)
 * - Select All / Clear All
 * - Derived selectedTree
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCategoryTree } from '../../hooks/useCategoryTree';
import * as yupooApi from '../../services/yupooApi';

// ── Mock the API ──────────────────────────────────────────────────────────────

jest.mock('../../services/yupooApi');

const MOCK_CATEGORIES = [
  {
    id: 'cat-1',
    name: 'La Liga',
    path: '/categories/5066920',
    itemCount: 37,
    subcategories: [
      { id: 'sub-1', name: 'Celta de Vigo', path: '/categories/729116', itemCount: 5, subcategories: [] },
      { id: 'sub-2', name: 'Mallorca', path: '/categories/729117', itemCount: 3, subcategories: [] },
    ],
  },
  {
    id: 'cat-2',
    name: 'Brasileiro Série A',
    path: '/categories/5066922',
    itemCount: 23,
    subcategories: [
      { id: 'sub-3', name: 'Atlético Mineiro', path: '/categories/729135', itemCount: 12, subcategories: [] },
    ],
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useCategoryTree', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Initial state ────────────────────────────────────────────────────────

  it('has correct initial state', () => {
    yupooApi.getYupooCategories.mockResolvedValue({ categories: [], cached: false, cachedAt: null });
    const { result } = renderHook(() => useCategoryTree({ autoFetch: false }));
    expect(result.current.categories).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.selected.size).toBe(0);
    expect(result.current.selectedCount).toBe(0);
  });

  // ── Successful fetch ─────────────────────────────────────────────────────

  it('fetches categories on mount when autoFetch=true', async () => {
    yupooApi.getYupooCategories.mockResolvedValue({
      categories: MOCK_CATEGORIES,
      cached: false,
      cachedAt: new Date().toISOString(),
    });
    const { result } = renderHook(() => useCategoryTree());
    // Should start loading
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.categories).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  // ── Error fetch ──────────────────────────────────────────────────────────

  it('sets error state when fetch fails', async () => {
    yupooApi.getYupooCategories.mockRejectedValue({ message: 'Network error' });
    const { result } = renderHook(() => useCategoryTree());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Network error');
    expect(result.current.categories).toEqual([]);
  });

  // ── Toggle node ──────────────────────────────────────────────────────────

  it('toggleNode selects a leaf node', async () => {
    yupooApi.getYupooCategories.mockResolvedValue({ categories: MOCK_CATEGORIES });
    const { result } = renderHook(() => useCategoryTree());
    await waitFor(() => !result.current.loading);
    act(() => {
      result.current.toggleNode(MOCK_CATEGORIES[0].subcategories[0]); // Celta de Vigo
    });
    expect(result.current.selected.has('sub-1')).toBe(true);
  });

  it('toggleNode selects parent and all children', async () => {
    yupooApi.getYupooCategories.mockResolvedValue({ categories: MOCK_CATEGORIES });
    const { result } = renderHook(() => useCategoryTree());
    await waitFor(() => !result.current.loading);
    act(() => {
      result.current.toggleNode(MOCK_CATEGORIES[0]); // La Liga (parent)
    });
    // Should select parent + both children
    expect(result.current.selected.has('cat-1')).toBe(true);
    expect(result.current.selected.has('sub-1')).toBe(true);
    expect(result.current.selected.has('sub-2')).toBe(true);
  });

  it('toggleNode deselects all when all are already selected', async () => {
    yupooApi.getYupooCategories.mockResolvedValue({ categories: MOCK_CATEGORIES });
    const { result } = renderHook(() => useCategoryTree());
    await waitFor(() => !result.current.loading);
    // First select all
    act(() => result.current.toggleNode(MOCK_CATEGORIES[0]));
    // Then deselect
    act(() => result.current.toggleNode(MOCK_CATEGORIES[0]));
    expect(result.current.selected.has('cat-1')).toBe(false);
    expect(result.current.selected.has('sub-1')).toBe(false);
  });

  // ── Select All / Clear All ───────────────────────────────────────────────

  it('selectAll selects every node in the tree', async () => {
    yupooApi.getYupooCategories.mockResolvedValue({ categories: MOCK_CATEGORIES });
    const { result } = renderHook(() => useCategoryTree());
    await waitFor(() => !result.current.loading);
    act(() => result.current.selectAll());
    // 2 top-level + 3 sub-categories
    expect(result.current.selected.size).toBe(5);
  });

  it('clearAll empties the selection', async () => {
    yupooApi.getYupooCategories.mockResolvedValue({ categories: MOCK_CATEGORIES });
    const { result } = renderHook(() => useCategoryTree());
    await waitFor(() => !result.current.loading);
    act(() => result.current.selectAll());
    act(() => result.current.clearAll());
    expect(result.current.selected.size).toBe(0);
  });

  // ── tooManySelected ──────────────────────────────────────────────────────

  it('tooManySelected is true when more than 50 categories selected', () => {
    yupooApi.getYupooCategories.mockResolvedValue({ categories: [] });
    const { result } = renderHook(() => useCategoryTree({ autoFetch: false }));
    act(() => {
      const bigSet = new Set(Array.from({ length: 51 }, (_, i) => `id-${i}`));
      result.current.setSelected(bigSet);
    });
    expect(result.current.tooManySelected).toBe(true);
  });

  // ── selectedTree ─────────────────────────────────────────────────────────

  it('selectedTree only includes selected nodes and their selected children', async () => {
    yupooApi.getYupooCategories.mockResolvedValue({ categories: MOCK_CATEGORIES });
    const { result } = renderHook(() => useCategoryTree());
    await waitFor(() => !result.current.loading);
    // Select one sub-category of cat-1
    act(() => {
      result.current.setSelected(new Set(['sub-1']));
    });
    const tree = result.current.selectedTree;
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('cat-1');
    expect(tree[0].subcategories).toHaveLength(1);
    expect(tree[0].subcategories[0].id).toBe('sub-1');
  });

  // ── Manual re-fetch ──────────────────────────────────────────────────────

  it('fetchCategories can be called manually to re-fetch', async () => {
    yupooApi.getYupooCategories.mockResolvedValue({ categories: MOCK_CATEGORIES });
    const { result } = renderHook(() => useCategoryTree({ autoFetch: false }));
    expect(yupooApi.getYupooCategories).not.toHaveBeenCalled();
    act(() => { result.current.fetchCategories(); });
    await waitFor(() => !result.current.loading);
    expect(yupooApi.getYupooCategories).toHaveBeenCalledTimes(1);
    expect(result.current.categories).toHaveLength(2);
  });
});
