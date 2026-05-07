/**
 * Unit tests for CategoryTree component.
 *
 * Tests cover:
 * - Rendering loading skeleton
 * - Rendering empty state
 * - Rendering categories with checkboxes
 * - Search filter
 * - Select All / Clear All
 * - Error banner with Retry
 * - Too-many-selected warning
 */
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import CategoryTree from '../../pages/admin/components/CategoryTree';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_CATEGORIES = [
  {
    id: 'cat-1',
    name: 'La Liga',
    path: '/categories/5066920',
    itemCount: 37,
    subcategories: [
      {
        id: 'sub-1',
        name: 'Celta de Vigo',
        path: '/categories/729116',
        itemCount: 0,
        subcategories: [],
      },
      {
        id: 'sub-2',
        name: 'Mallorca',
        path: '/categories/729117',
        itemCount: 5,
        subcategories: [],
      },
    ],
  },
  {
    id: 'cat-2',
    name: 'Brasileiro Série A',
    path: '/categories/5066922',
    itemCount: 23,
    subcategories: [
      {
        id: 'sub-3',
        name: 'Atlético Mineiro',
        path: '/categories/729135',
        itemCount: 12,
        subcategories: [],
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const noop = () => {};

function renderTree(overrides = {}) {
  const defaultProps = {
    categories: MOCK_CATEGORIES,
    selected: new Set(),
    onSelectionChange: noop,
    loading: false,
    error: null,
    onRefresh: noop,
    lastFetched: null,
  };
  return render(<CategoryTree {...defaultProps} {...overrides} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CategoryTree', () => {
  // ── Loading state ────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows skeleton when loading with no categories', () => {
      renderTree({ loading: true, categories: [] });
      const busy = document.querySelector('[aria-busy="true"]');
      expect(busy).toBeInTheDocument();
    });

    it('shows Refresh spinner when loading', () => {
      renderTree({ loading: true });
      const refreshBtn = screen.getByRole('button', { name: /refresh/i });
      expect(refreshBtn).toBeDisabled();
    });
  });

  // ── Empty state ──────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('shows empty message when no categories', () => {
      renderTree({ categories: [] });
      expect(
        screen.getByText(/no categories available/i)
      ).toBeInTheDocument();
    });
  });

  // ── Rendering categories ─────────────────────────────────────────────────

  describe('rendering categories', () => {
    it('renders top-level category names', () => {
      renderTree();
      expect(screen.getByText('La Liga')).toBeInTheDocument();
      expect(screen.getByText('Brasileiro Série A')).toBeInTheDocument();
    });

    it('renders item counts', () => {
      renderTree();
      expect(screen.getByLabelText('37 items')).toBeInTheDocument();
      expect(screen.getByLabelText('23 items')).toBeInTheDocument();
    });

    it('renders checkboxes for categories', () => {
      renderTree();
      const checkboxes = screen.getAllByRole('checkbox');
      // 2 top-level + 3 sub-categories = 5 checkboxes
      expect(checkboxes.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Error state ──────────────────────────────────────────────────────────

  describe('error state', () => {
    it('displays error message', () => {
      renderTree({ error: 'Network error' });
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('calls onRefresh when Retry is clicked', () => {
      const onRefresh = jest.fn();
      renderTree({ error: 'Failed', onRefresh });
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  // ── Select All / Clear All ───────────────────────────────────────────────

  describe('Select All / Clear All', () => {
    it('calls onSelectionChange with all IDs when Select All clicked', () => {
      const onSelectionChange = jest.fn();
      renderTree({ onSelectionChange });
      fireEvent.click(screen.getByRole('button', { name: /select all/i }));
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      const arg = onSelectionChange.mock.calls[0][0];
      expect(arg instanceof Set).toBe(true);
      // Should include all 5 nodes
      expect(arg.size).toBe(5);
    });

    it('calls onSelectionChange with empty set when Clear All clicked', () => {
      const onSelectionChange = jest.fn();
      const allSelected = new Set(['cat-1', 'sub-1', 'sub-2', 'cat-2', 'sub-3']);
      renderTree({ selected: allSelected, onSelectionChange });
      fireEvent.click(screen.getByRole('button', { name: /clear all/i }));
      expect(onSelectionChange).toHaveBeenCalledWith(new Set());
    });

    it('Clear All is disabled when nothing is selected', () => {
      renderTree({ selected: new Set() });
      expect(
        screen.getByRole('button', { name: /clear all/i })
      ).toBeDisabled();
    });
  });

  // ── Search ───────────────────────────────────────────────────────────────

  describe('search', () => {
    it('filters categories by name', () => {
      renderTree();
      const searchInput = screen.getByRole('searchbox', { name: /search categories/i });
      fireEvent.change(searchInput, { target: { value: 'La Liga' } });
      expect(screen.getByText('La Liga')).toBeInTheDocument();
      expect(screen.queryByText('Brasileiro Série A')).not.toBeInTheDocument();
    });

    it('shows no-match message when search has no results', () => {
      renderTree();
      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'xyz123notexist' } });
      expect(screen.getByText(/no categories match/i)).toBeInTheDocument();
    });

    it('shows Clear button when search is non-empty', () => {
      renderTree();
      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'Liga' } });
      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    });
  });

  // ── Too-many warning ─────────────────────────────────────────────────────

  describe('too-many-selected warning', () => {
    it('shows warning when more than 50 categories selected', () => {
      const manyIds = new Set(
        Array.from({ length: 51 }, (_, i) => `id-${i}`)
      );
      renderTree({ selected: manyIds });
      expect(screen.getByText(/51 categories/i)).toBeInTheDocument();
    });

    it('does not show warning for 50 or fewer selections', () => {
      const ids = new Set(Array.from({ length: 50 }, (_, i) => `id-${i}`));
      renderTree({ selected: ids });
      expect(screen.queryByText(/may take 5\+ minutes/i)).not.toBeInTheDocument();
    });
  });

  // ── Last-fetched timestamp ───────────────────────────────────────────────

  describe('last-fetched timestamp', () => {
    it('shows last fetched timestamp when provided', () => {
      const recent = new Date(Date.now() - 2 * 60000).toISOString(); // 2 min ago
      renderTree({ lastFetched: recent });
      expect(screen.getByText(/2 min ago/i)).toBeInTheDocument();
    });

    it('shows "just now" for very recent timestamps', () => {
      const now = new Date().toISOString();
      renderTree({ lastFetched: now });
      expect(screen.getByText(/just now/i)).toBeInTheDocument();
    });
  });

  // ── Accessibility ────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('tree container has role="tree" and aria-multiselectable', () => {
      renderTree();
      const tree = screen.getByRole('tree');
      expect(tree).toHaveAttribute('aria-multiselectable', 'true');
    });

    it('selection count is announced via aria-live', () => {
      const selected = new Set(['cat-1']);
      renderTree({ selected });
      const live = document.querySelector('[aria-live="polite"]');
      expect(live).toBeInTheDocument();
    });
  });
});
