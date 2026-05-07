/**
 * CategoryTreeNode
 * Renders a single node in the Yupoo category tree.
 * Supports indeterminate checkbox state for partial child selection.
 *
 * @param {Object} props
 * @param {Object} props.node - Category node {id, name, path, subcategories, itemCount}
 * @param {Set<string>} props.selected - Set of selected category IDs
 * @param {function} props.onToggle - (node, includeChildren) => void
 * @param {string} props.searchQuery - Active search query for highlighting
 * @param {number} [props.depth=0] - Current nesting depth
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';

const MAX_INITIAL_CHILDREN = 5;

function CategoryTreeNode({ node, selected, onToggle, searchQuery, depth = 0 }) {
  const checkboxRef = useRef(null);
  const [expanded, setExpanded] = useState(depth === 0);
  const [showAll, setShowAll] = useState(false);

  const hasChildren = Array.isArray(node.subcategories) && node.subcategories.length > 0;
  const childIds = hasChildren ? node.subcategories.map((c) => c.id) : [];

  const isChecked = selected.has(node.id);
  const checkedChildCount = childIds.filter((id) => selected.has(id)).length;
  const isIndeterminate =
    hasChildren && !isChecked && checkedChildCount > 0 && checkedChildCount < childIds.length;
  const allChildrenSelected = hasChildren && childIds.every((id) => selected.has(id));

  // Keep indeterminate DOM property in sync
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // Auto-expand when search is active
  useEffect(() => {
    if (searchQuery && searchQuery.trim()) {
      setExpanded(true);
    }
  }, [searchQuery]);

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

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        onToggle(node);
      } else if (e.key === 'ArrowRight' && hasChildren) {
        e.preventDefault();
        setExpanded(true);
      } else if (e.key === 'ArrowLeft' && hasChildren) {
        e.preventDefault();
        setExpanded(false);
      }
    },
    [node, onToggle, hasChildren]
  );

  // Highlight matched text in search
  const highlight = (text) => {
    if (!searchQuery || !searchQuery.trim()) return text;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-brand-100 text-brand-700 rounded-sm px-0.5">
          {text.slice(idx, idx + searchQuery.length)}
        </mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

  const isEmpty = !hasChildren && (node.itemCount === 0 || node.itemCount === undefined);
  const itemCount = typeof node.itemCount === 'number' ? node.itemCount : null;

  const paddingLeft = depth * 16 + 8;

  const visibleChildren = showAll
    ? node.subcategories
    : (node.subcategories || []).slice(0, MAX_INITIAL_CHILDREN);
  const hiddenCount = hasChildren
    ? node.subcategories.length - MAX_INITIAL_CHILDREN
    : 0;

  return (
    <div role="treeitem" aria-selected={isChecked} aria-expanded={hasChildren ? expanded : undefined}>
      <label
        className={`flex items-center gap-2 py-1.5 rounded-md px-2 cursor-pointer select-none
          hover:bg-surface-muted transition-colors
          ${isEmpty ? 'opacity-50' : ''}`}
        style={{ paddingLeft }}
        title={isEmpty ? 'No products found in this category' : undefined}
      >
        {/* Checkbox */}
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={isChecked || allChildrenSelected}
          onChange={handleToggle}
          onKeyDown={handleKeyDown}
          aria-label={`Select ${node.name}`}
          className="flex-shrink-0 rounded border-line text-brand focus:ring-brand focus:ring-offset-0 w-4 h-4 cursor-pointer"
        />

        {/* Chevron */}
        <button
          type="button"
          onClick={handleChevronClick}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          className={`flex-shrink-0 w-4 h-4 text-ink-faint hover:text-ink transition-all duration-150
            ${!hasChildren ? 'invisible' : ''}`}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-150 ${expanded ? 'rotate-90' : 'rotate-0'}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Name */}
        <span
          className={`flex-1 text-sm min-w-0 truncate ${
            isEmpty ? 'text-ink-faint italic' : 'text-ink'
          }`}
        >
          {highlight(node.name)}
        </span>

        {/* Item count badge */}
        {itemCount !== null && (
          <span
            className={`ml-auto flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-md
              ${itemCount > 0 ? 'text-ink-muted bg-surface-sunken' : 'text-ink-faint'}`}
          >
            {itemCount}
          </span>
        )}
      </label>

      {/* Children */}
      {hasChildren && expanded && (
        <div role="group" aria-label={`${node.name} subcategories`}>
          {visibleChildren.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              selected={selected}
              onToggle={onToggle}
              searchQuery={searchQuery}
              depth={depth + 1}
            />
          ))}
          {!showAll && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-xs text-brand hover:underline font-medium ml-8 mt-1 mb-1 block"
              style={{ paddingLeft: paddingLeft + 32 }}
            >
              + Show {hiddenCount} more…
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CategoryTreeNode;
