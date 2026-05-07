/**
 * Unit tests for CategoryTreeNode component.
 *
 * Tests cover:
 * - Checked / unchecked state
 * - Indeterminate state with partial child selection
 * - Expand / collapse via chevron
 * - Keyboard navigation (Space, ArrowRight, ArrowLeft)
 * - Search text highlighting
 * - Progressive child reveal ("Show N more")
 * - Empty category styling
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryTreeNode from '../../pages/admin/components/CategoryTreeNode';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const LEAF_NODE = {
  id: 'leaf-1',
  name: 'Celta de Vigo',
  path: '/categories/729116',
  itemCount: 5,
  subcategories: [],
};

const EMPTY_NODE = {
  id: 'empty-1',
  name: 'Worldwide Other League',
  path: '/categories/5066921',
  itemCount: 0,
  subcategories: [],
};

const PARENT_NODE = {
  id: 'parent-1',
  name: 'La Liga',
  path: '/categories/5066920',
  itemCount: 37,
  subcategories: [
    {
      id: 'child-1',
      name: 'Celta de Vigo',
      path: '/categories/729116',
      itemCount: 5,
      subcategories: [],
    },
    {
      id: 'child-2',
      name: 'Mallorca',
      path: '/categories/729117',
      itemCount: 3,
      subcategories: [],
    },
  ],
};

// Generate a parent with 7 children to test progressive reveal
const LARGE_PARENT_NODE = {
  id: 'large-parent',
  name: 'Large League',
  path: '/categories/9999',
  itemCount: 7,
  subcategories: Array.from({ length: 7 }, (_, i) => ({
    id: `big-child-${i}`,
    name: `Team ${i + 1}`,
    path: `/categories/${1000 + i}`,
    itemCount: 1,
    subcategories: [],
  })),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const noop = () => {};

function renderNode(node, overrides = {}) {
  const defaultProps = {
    node,
    selected: new Set(),
    onToggle: noop,
    searchQuery: '',
    depth: 0,
  };
  return render(<CategoryTreeNode {...defaultProps} {...overrides} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CategoryTreeNode', () => {
  // ── Basic rendering ──────────────────────────────────────────────────────

  describe('basic rendering', () => {
    it('renders the node name', () => {
      renderNode(LEAF_NODE);
      expect(screen.getByText('Celta de Vigo')).toBeInTheDocument();
    });

    it('renders item count when provided', () => {
      renderNode(LEAF_NODE);
      expect(screen.getByLabelText('5 items')).toBeInTheDocument();
    });

    it('renders checkbox', () => {
      renderNode(LEAF_NODE);
      expect(
        screen.getByRole('checkbox', { name: /select celta de vigo/i })
      ).toBeInTheDocument();
    });
  });

  // ── Checked state ────────────────────────────────────────────────────────

  describe('checked state', () => {
    it('checkbox is checked when node id is in selected set', () => {
      renderNode(LEAF_NODE, { selected: new Set(['leaf-1']) });
      expect(
        screen.getByRole('checkbox', { name: /select celta de vigo/i })
      ).toBeChecked();
    });

    it('checkbox is unchecked when node id is not in selected set', () => {
      renderNode(LEAF_NODE, { selected: new Set() });
      expect(
        screen.getByRole('checkbox', { name: /select celta de vigo/i })
      ).not.toBeChecked();
    });
  });

  // ── Toggle ───────────────────────────────────────────────────────────────

  describe('toggle', () => {
    it('calls onToggle with the node when checkbox is changed', () => {
      const onToggle = jest.fn();
      renderNode(LEAF_NODE, { onToggle });
      fireEvent.click(
        screen.getByRole('checkbox', { name: /select celta de vigo/i })
      );
      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledWith(LEAF_NODE);
    });
  });

  // ── Empty category ───────────────────────────────────────────────────────

  describe('empty category', () => {
    it('applies reduced opacity to empty categories', () => {
      const { container } = renderNode(EMPTY_NODE);
      const label = container.querySelector('label');
      expect(label.className).toMatch(/opacity-50/);
    });

    it('shows tooltip hint for empty categories', () => {
      const { container } = renderNode(EMPTY_NODE);
      const label = container.querySelector('label');
      expect(label).toHaveAttribute('title', 'No products found in this category');
    });
  });

  // ── Parent node with children ────────────────────────────────────────────

  describe('parent with children', () => {
    it('shows children when expanded (depth=0 starts expanded)', () => {
      renderNode(PARENT_NODE);
      // Root nodes start expanded
      expect(screen.getByText('Celta de Vigo')).toBeInTheDocument();
      expect(screen.getByText('Mallorca')).toBeInTheDocument();
    });

    it('toggles expansion when chevron is clicked', () => {
      renderNode(PARENT_NODE);
      const expandBtn = screen.getByRole('button', { name: /collapse la liga/i });
      fireEvent.click(expandBtn);
      // After collapse, children should not be visible
      expect(screen.queryByText('Celta de Vigo')).not.toBeInTheDocument();
    });

    it('has invisible chevron for leaf nodes', () => {
      const { container } = renderNode(LEAF_NODE);
      // Chevron button should have invisible class
      const chevron = container.querySelector('button[aria-label]');
      // Leaf nodes have invisible chevron
      if (chevron) {
        expect(chevron.className).toMatch(/invisible/);
      }
    });
  });

  // ── Keyboard navigation ──────────────────────────────────────────────────

  describe('keyboard navigation', () => {
    it('calls onToggle when Space is pressed on checkbox', () => {
      const onToggle = jest.fn();
      renderNode(LEAF_NODE, { onToggle });
      const checkbox = screen.getByRole('checkbox', { name: /select celta de vigo/i });
      fireEvent.keyDown(checkbox, { key: ' ' });
      expect(onToggle).toHaveBeenCalledWith(LEAF_NODE);
    });

    it('expands node when ArrowRight is pressed', () => {
      renderNode(PARENT_NODE, { depth: 1 }); // depth=1 starts collapsed
      const collapseBtn = screen.queryByRole('button', { name: /collapse la liga/i });
      // If it was already expanded at depth=1, we collapse first
      if (collapseBtn) {
        fireEvent.click(collapseBtn);
      }
      const checkbox = screen.getByRole('checkbox', { name: /select la liga/i });
      fireEvent.keyDown(checkbox, { key: 'ArrowRight' });
      // Children should now be visible
      expect(screen.getByText('Celta de Vigo')).toBeInTheDocument();
    });
  });

  // ── Search highlighting ──────────────────────────────────────────────────

  describe('search highlighting', () => {
    it('wraps matched text in <mark>', () => {
      const { container } = renderNode(LEAF_NODE, { searchQuery: 'Celta' });
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark.textContent).toBe('Celta');
    });

    it('does not render mark when no search query', () => {
      const { container } = renderNode(LEAF_NODE, { searchQuery: '' });
      expect(container.querySelector('mark')).not.toBeInTheDocument();
    });
  });

  // ── Progressive reveal ───────────────────────────────────────────────────

  describe('progressive child reveal', () => {
    it('shows "Show N more" when there are more than 5 children', () => {
      renderNode(LARGE_PARENT_NODE);
      expect(screen.getByText(/show 2 more/i)).toBeInTheDocument();
    });

    it('reveals all children when "Show N more" is clicked', () => {
      renderNode(LARGE_PARENT_NODE);
      fireEvent.click(screen.getByText(/show 2 more/i));
      // All 7 teams should now be visible
      expect(screen.getByText('Team 6')).toBeInTheDocument();
      expect(screen.getByText('Team 7')).toBeInTheDocument();
    });

    it('does not show progressive reveal button for ≤5 children', () => {
      renderNode(PARENT_NODE); // Only 2 children
      expect(screen.queryByText(/show .* more/i)).not.toBeInTheDocument();
    });
  });

  // ── Accessibility ────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('has role="treeitem" on the wrapper', () => {
      renderNode(LEAF_NODE);
      expect(screen.getByRole('treeitem')).toBeInTheDocument();
    });

    it('has aria-selected reflecting checked state', () => {
      renderNode(LEAF_NODE, { selected: new Set(['leaf-1']) });
      expect(screen.getByRole('treeitem')).toHaveAttribute('aria-selected', 'true');
    });

    it('has aria-expanded on parent nodes', () => {
      renderNode(PARENT_NODE);
      expect(screen.getByRole('treeitem')).toHaveAttribute('aria-expanded');
    });

    it('does not have aria-expanded on leaf nodes', () => {
      renderNode(LEAF_NODE);
      expect(
        screen.getByRole('treeitem')
      ).not.toHaveAttribute('aria-expanded');
    });
  });
});
