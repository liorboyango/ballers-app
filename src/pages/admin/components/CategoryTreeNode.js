/**
 * CategoryTreeNode
 * Renders a single node in the Yupoo category tree.
 * Supports:
 * - Indeterminate checkbox state for partial child selection
 * - Keyboard navigation: Space=toggle, ArrowRight=expand, ArrowLeft=collapse
 * - Search text highlighting
 * - Progressive child reveal ("Show N more")
 * - Accessibility: role=treeitem, aria-selected, aria-expanded
 *
 * @param {Object} props
 * @param {Object} props.node - Category node {id, name, path, subcategories, itemCount}
 * @param {Set<string>} props.selected - Set of selected category IDs
 * @param {function} props.onToggle - (node: CategoryNode) => void
 * @param {string} [props.searchQuery] - Active search query for highlighting
 * @param {number} [props.depth=0] - Current nesting depth
 * @param {boolean} [props.forceExpanded] - When true, override local expanded state
 */
import React, { useRef, useEffect, useState, useCallback, useId } from 'react';

/** Maximum children shown before "Show N more" button */
const MAX_INITIAL_CHILDREN = 5;

/**
 * Derive the checked/indeterminate state of a node from the selection set.
 * - checked: the node itself is in `selected`
 * - allChildrenSelected: node has children and all are selected
 * - indeterminate: some (not all) children are selected
 */
function useNodeCheckState(node, selected) {
  const hasChildren =
    Array.isArray(node.subcategories) && node.subcategories.length > 0;

  const childIds = hasChildren ? node.subcategories.map((c) => c.id) : [];
  const checkedChildCount = childIds.filter((id) => selected.has(id)).length;

  const isChecked = selected.has(node.id);
  const allChildrenSelected = hasChildren && checkedChildCount === childIds.length;
  const someChildrenSelected =
    hasChildren && checkedChildCount > 0 && checkedChildCount < childIds.length;

  // A node is "indeterminate" when it itself is unchecked but some children are
  const isIndeterminate = !isChecked && someChildrenSelected;

  return { isChecked, isIndeterminate, allChildrenSelected, hasChildren };
}

/**
 * Highlight the search query inside a text string.
 * Returns a React element with a <mark> wrapping the matched portion.
 */
function HighlightedText({ text, query }) {
  if (!query || !query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-brand-100 text-brand-600 rounded-sm px-0.5 not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function CategoryTreeNode({
  node,
  selected,
  onToggle,
  searchQuery = '',
  depth = 0,
  forceExpanded = false,
}) {
  const checkboxRef = useRef(null);
  const labelRef = useRef(null);
  const nodeId = useId();

  // Local expanded state — starts open for root nodes
  const [expanded, setExpanded] = useState(depth === 0);
  const [showAll, setShowAll] = useState(false);

  const { isChecked, isIndeterminate, allChildrenSelected, hasChildren } =
    useNodeCheckState(node, selected);

  // Sync indeterminate DOM property (not controllable via React prop)
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // Auto-expand when search is active or forceExpanded
  useEffect(() => {
    if ((searchQuery && searchQuery.trim()) || forceExpanded) {
      setExpanded(true);
    }
  }, [searchQuery, forceExpanded]);

  const handleToggle = useCallback(
    (e) => {
      e.stopPropagation();
      onToggle(node);
    },
    [node, onToggle]
  );

  const handleChevronClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (hasChildren) setExpanded((prev) => !prev);
    },
    [hasChildren]
  );

  /** Keyboard navigation per ARIA tree pattern */
  const handleKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          onToggle(node);
          break;
        case 'Enter':
          e.preventDefault();
          onToggle(node);
          break;
        case 'ArrowRight':
          if (hasChildren) {
            e.preventDefault();
            setExpanded(true);
          }
          break;
        case 'ArrowLeft':
          if (hasChildren) {
            e.preventDefault();
            setExpanded(false);
          }
          break;
        default:
          break;
      }
    },
    [node, onToggle, hasChildren]
  );

  const isEmpty =
    !hasChildren &&
    typeof node.itemCount === 'number' &&
    node.itemCount === 0;

  const itemCount =
    typeof node.itemCount === 'number' ? node.itemCount : null;

  // Progressive children reveal
  const allChildren = node.subcategories || [];
  const visibleChildren = showAll
    ? allChildren
    : allChildren.slice(0, MAX_INITIAL_CHILDREN);
  const hiddenCount = allChildren.length - MAX_INITIAL_CHILDREN;

  // Indentation: 16px per depth level + 8px base
  const paddingLeft = depth * 16 + 8;

  // The checkbox visual state: treat "all children selected" same as checked
  const checkboxChecked = isChecked || allChildrenSelected;

  const groupId = `${nodeId}-children`;

  return (
    <div
      role="treeitem"
      aria-selected={isChecked}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-owns={hasChildren && expanded ? groupId : undefined}
    >
      <label
        ref={labelRef}
        className={[
          'flex items-center gap-2 py-1.5 rounded-md px-2',
          'cursor-pointer select-none',
          'hover:bg-surface-muted transition-colors',
          isEmpty ? 'opacity-50' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ paddingLeft }}
        title={
          isEmpty
            ? 'No products found in this category'
            : undefined
        }
      >
        {/* Checkbox */}
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={checkboxChecked}
          onChange={handleToggle}
          onKeyDown={handleKeyDown}
          aria-label={`Select ${node.name}`}
          aria-describedby={
            isEmpty ? `${nodeId}-empty` : undefined
          }
          className={
            'flex-shrink-0 rounded border-line text-brand ' +
            'focus:ring-2 focus:ring-brand/30 focus:ring-offset-0 ' +
            'w-4 h-4 cursor-pointer transition-colors'
          }
        />

        {/* Expand/Collapse chevron */}
        <button
          type="button"
          tabIndex={-1}
          onClick={handleChevronClick}
          aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
          aria-controls={hasChildren ? groupId : undefined}
          className={[
            'flex-shrink-0 w-4 h-4 text-ink-faint',
            'hover:text-ink transition-all duration-150',
            !hasChildren ? 'invisible pointer-events-none' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-150 ${
              expanded ? 'rotate-90' : 'rotate-0'
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Category name with search highlighting */}
        <span
          id={`${nodeId}-name`}
          className={`flex-1 text-sm min-w-0 truncate ${
            isEmpty ? 'text-ink-faint italic' : 'text-ink'
          }`}
        >
          <HighlightedText text={node.name} query={searchQuery} />
        </span>

        {/* Item count badge */}
        {itemCount !== null && (
          <span
            className={[
              'ml-auto flex-shrink-0 text-xs font-medium',
              'px-1.5 py-0.5 rounded-md',
              itemCount > 0
                ? 'text-ink-muted bg-surface-sunken'
                : 'text-ink-faint',
            ].join(' ')}
            aria-label={`${itemCount} item${itemCount !== 1 ? 's' : ''}`}
          >
            {itemCount}
          </span>
        )}

        {/* Hidden empty hint for screen readers */}
        {isEmpty && (
          <span id={`${nodeId}-empty`} className="sr-only">
            Empty category — no products
          </span>
        )}
      </label>

      {/* Children subtree */}
      {hasChildren && expanded && (
        <div
          id={groupId}
          role="group"
          aria-label={`${node.name} subcategories`}
        >
          {visibleChildren.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              selected={selected}
              onToggle={onToggle}
              searchQuery={searchQuery}
              depth={depth + 1}
              forceExpanded={forceExpanded}
            />
          ))}

          {/* Progressive reveal button */}
          {!showAll && hiddenCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAll(true);
              }}
              className="text-xs text-brand hover:underline font-medium block mt-0.5 mb-1"
              style={{ paddingLeft: paddingLeft + 32 }}
            >
              +&nbsp;Show {hiddenCount} more…
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CategoryTreeNode;
