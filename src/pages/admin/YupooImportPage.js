/**
 * YupooImportPage
 * Three-stage bulk import wizard for Yupoo products.
 *
 * Stage 1 — Category Browser: fetch & display selectable category tree
 * Stage 2 — Review & Configure: confirm selection + set import defaults
 * Stage 3 — Import Progress: run crawl and show results
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryTree from './components/CategoryTree';
import ImportDefaults from './components/ImportDefaults';
import CrawlProgress from './components/CrawlProgress';
import { getYupooCategories, crawlCategories } from '../../services/yupooApi';
import { useToast } from '../../context/ToastContext';

const STAGES = {
  BROWSE: 'browse',
  REVIEW: 'review',
  IMPORT: 'import',
};

const DEFAULT_IMPORT_CONFIG = {
  price: 99.99,
  kitType: 'home',
  stock: 10,
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
};

/** Flatten a category tree into a list of only the nodes with no subcategories
 * or the top-level nodes if they have children. Used for "selected" flat list. */
const flattenSelected = (nodes, selected) => {
  const result = [];
  const traverse = (node) => {
    if (selected.has(node.id)) {
      // Include node (and its children will be crawled server-side)
      result.push(node);
    } else if (Array.isArray(node.subcategories)) {
      node.subcategories.forEach(traverse);
    }
  };
  nodes.forEach(traverse);
  return result;
};

/** Get only the top-level selected categories with their selected children */
const buildSelectedTree = (nodes, selected) => {
  const result = [];
  const traverse = (node) => {
    const selectedChildren = Array.isArray(node.subcategories)
      ? node.subcategories.filter((c) => selected.has(c.id))
      : [];
    if (selected.has(node.id) || selectedChildren.length > 0) {
      result.push({ ...node, subcategories: selectedChildren });
    }
  };
  nodes.forEach(traverse);
  return result;
};

function StageIndicator({ stage }) {
  const steps = [
    { key: STAGES.BROWSE, label: 'Browse' },
    { key: STAGES.REVIEW, label: 'Review' },
    { key: STAGES.IMPORT, label: 'Import' },
  ];
  const activeIndex = steps.findIndex((s) => s.key === stage);

  return (
    <nav aria-label="Import progress steps" className="flex items-center gap-2 mb-6">
      {steps.map((step, i) => {
        const isDone = i < activeIndex;
        const isActive = i === activeIndex;
        return (
          <React.Fragment key={step.key}>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                  ${
                    isDone
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-brand text-white'
                      : 'bg-surface-sunken text-ink-faint'
                  }`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  isActive ? 'text-ink' : isDone ? 'text-green-600' : 'text-ink-faint'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px max-w-[3rem] ${ i < activeIndex ? 'bg-green-400' : 'bg-line' }`} />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

function YupooImportPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [stage, setStage] = useState(STAGES.BROWSE);

  // Categories
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // Selection
  const [selected, setSelected] = useState(new Set());

  // Defaults
  const [defaults, setDefaults] = useState(DEFAULT_IMPORT_CONFIG);

  // Crawl
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlResult, setCrawlResult] = useState(null);
  const [crawlError, setCrawlError] = useState(null);

  // Blocking navigation during import
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (crawlLoading) {
        e.preventDefault();
        e.returnValue = 'Import is running. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [crawlLoading]);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await getYupooCategories();
      const cats = res?.data?.categories || res?.categories || [];
      setCategories(cats);
      setLastFetched(res?.data?.cachedAt || res?.cachedAt || new Date().toISOString());
    } catch (err) {
      const msg = err?.message || 'Failed to load categories. Please try again.';
      setCategoriesError(msg);
      toast.error(msg);
    } finally {
      setCategoriesLoading(false);
    }
  }, [toast]);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDefaultsChange = (field, value) => {
    setDefaults((prev) => ({ ...prev, [field]: value }));
  };

  const handleProceedToReview = () => {
    if (selected.size === 0) {
      toast.warning('Please select at least one category.');
      return;
    }
    setStage(STAGES.REVIEW);
  };

  const handleBackToBrowse = () => {
    if (crawlLoading) {
      if (!window.confirm('Import is running. Cancel it and go back?')) return;
    }
    setStage(STAGES.BROWSE);
    setCrawlResult(null);
    setCrawlError(null);
  };

  const handleStartImport = async () => {
    setStage(STAGES.IMPORT);
    setCrawlLoading(true);
    setCrawlResult(null);
    setCrawlError(null);

    // Build the list of selected category nodes to send
    const selectedTree = buildSelectedTree(categories, selected);

    try {
      const res = await crawlCategories(selectedTree, defaults);
      const data = res?.data || res;
      setCrawlResult(data);
      const created = data?.created ?? 0;
      const skipped = data?.skipped ?? 0;
      const errCount = (data?.errors ?? []).length;
      if (created > 0) {
        toast.success(`Import complete! ${created} product${created !== 1 ? 's' : ''} created.`);
      } else if (errCount > 0) {
        toast.error(`Import finished with ${errCount} error${errCount !== 1 ? 's' : ''}.`);
      } else {
        toast.info(`Import finished. ${skipped} product${skipped !== 1 ? 's' : ''} skipped (duplicates).`);
      }
    } catch (err) {
      const msg = err?.message || 'Import failed. Please try again.';
      setCrawlError(msg);
      toast.error(msg);
    } finally {
      setCrawlLoading(false);
    }
  };

  const handleDone = () => {
    // Reset and go back to browse
    setStage(STAGES.BROWSE);
    setCrawlResult(null);
    setCrawlError(null);
    setSelected(new Set());
  };

  const handleViewProducts = () => {
    navigate('/admin/inventory');
  };

  // Count selected top-level categories for display
  const selectedTopLevel = buildSelectedTree(categories, selected);

  return (
    <div className="space-y-6 page-enter">
      <StageIndicator stage={stage} />

      {/* Stage 1: Browse */}
      {stage === STAGES.BROWSE && (
        <div className="card p-6">
          <div className="flex flex-col" style={{ minHeight: 400 }}>
            <CategoryTree
              categories={categories}
              selected={selected}
              onSelectionChange={setSelected}
              loading={categoriesLoading}
              error={categoriesError}
              onRefresh={fetchCategories}
              lastFetched={lastFetched}
            />
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
            <span className="text-sm text-ink-muted">
              {selected.size > 0 ? (
                <span>
                  <strong className="text-ink">{selected.size}</strong> item{selected.size !== 1 ? 's' : ''} selected
                </span>
              ) : (
                'Select categories to import'
              )}
            </span>
            <button
              type="button"
              onClick={handleProceedToReview}
              disabled={selected.size === 0 || categoriesLoading}
              className="btn-primary py-2.5 px-5 text-sm disabled:opacity-60"
            >
              Review &amp; Import
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Stage 2: Review & Configure */}
      {stage === STAGES.REVIEW && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-ink">Import Defaults</h3>
            </div>
            <ImportDefaults
              defaults={defaults}
              onChange={handleDefaultsChange}
              disabled={crawlLoading}
            />
          </div>

          <div className="card p-6">
            <h3 className="text-base font-bold text-ink mb-3">
              Selected Categories ({selectedTopLevel.length})
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {selectedTopLevel.map((cat) => (
                <div key={cat.id} className="border border-line rounded-lg px-4 py-3">
                  <div className="font-semibold text-sm text-ink">{cat.name}</div>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {cat.subcategories.map((sub) => (
                        <li key={sub.id} className="text-xs text-ink-muted pl-3 before:content-['-_'] before:text-ink-faint">
                          {sub.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-ink-muted mt-4">
              <span className="font-semibold text-ink">{selected.size}</span> total categor{selected.size !== 1 ? 'ies' : 'y'} selected.
              Images: up to 10 per product (big.jpg quality).
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToBrowse}
              className="btn-secondary py-2.5 px-4 text-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToBrowse}
                className="btn-ghost py-2.5 px-4 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartImport}
                className="btn-primary py-2.5 px-5 text-sm"
              >
                Start Import
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage 3: Import Progress */}
      {stage === STAGES.IMPORT && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-ink">Import Progress</h3>
            {!crawlLoading && (
              <button
                type="button"
                onClick={handleBackToBrowse}
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                New Import
              </button>
            )}
          </div>
          <CrawlProgress
            result={crawlResult}
            loading={crawlLoading}
            error={crawlError}
            selectedCategories={selectedTopLevel}
            onDone={handleDone}
            onViewProducts={handleViewProducts}
          />
        </div>
      )}
    </div>
  );
}

export default YupooImportPage;
