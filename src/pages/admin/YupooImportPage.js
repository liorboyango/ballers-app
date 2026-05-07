/**
 * YupooImportPage
 * Three-stage bulk import wizard for Yupoo products.
 *
 * Stage 1 — Category Browser: fetch & display selectable category tree
 * Stage 2 — Review & Configure: confirm selection + set import defaults (wrapped in <form>)
 * Stage 3 — Import Progress: run crawl and show results
 *
 * Task 3 implements:
 * - Proper <form> element with client-side validation in Stage 2
 * - Validate price > 0, stock >= 0, at least 1 size selected
 * - Inline validation error messages (accessible)
 * - Loading spinner on the Start Import button during submission
 * - Confirmation before import starts
 * - Defaults persisted to sessionStorage across tab switches
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryTree from './components/CategoryTree';
import ImportDefaults from './components/ImportDefaults';
import CrawlProgress from './components/CrawlProgress';
import { getYupooCategories, crawlCategories } from '../../services/yupooApi';
import { useToast } from '../../context/ToastContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = {
  BROWSE: 'browse',
  REVIEW: 'review',
  IMPORT: 'import',
};

const DEFAULTS_STORAGE_KEY = 'ballers_yupoo_import_defaults';

const FALLBACK_DEFAULTS = {
  price: 99.99,
  kitType: 'home',
  stock: 10,
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  customizable: true,
};

/** Load persisted defaults from sessionStorage, falling back to hardcoded values. */
function loadDefaults() {
  try {
    const stored = sessionStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate stored value has expected shape
      if (
        typeof parsed.price === 'number' &&
        typeof parsed.kitType === 'string' &&
        typeof parsed.stock === 'number' &&
        Array.isArray(parsed.sizes)
      ) {
        return { ...FALLBACK_DEFAULTS, ...parsed };
      }
    }
  } catch {
    // ignore parse errors
  }
  return { ...FALLBACK_DEFAULTS };
}

/** Persist defaults to sessionStorage. */
function saveDefaults(defaults) {
  try {
    sessionStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(defaults));
  } catch {
    // ignore storage errors (e.g. private mode quota)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validate import defaults. Returns a map of field → error message.
 * @param {Object} defaults
 * @returns {Object} errors object (empty means valid)
 */
function validateDefaults(defaults) {
  const errors = {};
  if (!defaults.price || defaults.price <= 0) {
    errors.price = 'Price must be greater than 0.';
  }
  if (defaults.stock < 0 || !Number.isInteger(defaults.stock)) {
    errors.stock = 'Stock must be a non-negative whole number.';
  }
  if (!defaults.sizes || defaults.sizes.length === 0) {
    errors.sizes = 'At least one size must be selected.';
  }
  return errors;
}

/**
 * Build the list of selected top-level categories with their selected children.
 * Only top-level categories with themselves or some children selected are included.
 * @param {Object[]} nodes - Full category tree
 * @param {Set<string>} selected - Set of selected IDs
 * @returns {Object[]} Filtered tree of selected items
 */
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

// ─── StageIndicator ───────────────────────────────────────────────────────────

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
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
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
              <div
                className={`flex-1 h-px max-w-[3rem] ${
                  i < activeIndex ? 'bg-green-400' : 'bg-line'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─── ConfirmImportDialog ──────────────────────────────────────────────────────

/**
 * Simple confirmation dialog shown before starting import.
 * Displays category count and expected behaviour.
 */
function ConfirmImportDialog({ categoryCount, onConfirm, onCancel }) {
  const dialogRef = useRef(null);

  // Trap focus inside dialog
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const focusables = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length) focusables[0].focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-brand"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
          <div>
            <h2 id="confirm-dialog-title" className="text-base font-bold text-ink">
              Start Import?
            </h2>
            <p id="confirm-dialog-desc" className="text-sm text-ink-muted mt-1">
              You are about to import products from{' '}
              <strong className="text-ink">
                {categoryCount} categor{categoryCount !== 1 ? 'ies' : 'y'}
              </strong>.
              This will fetch each category from Yupoo, parse album data, and create
              new products in your store. Existing products with matching names will be
              skipped.
            </p>
          </div>
        </div>

        {categoryCount > 20 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
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
            <span>Large import — may take several minutes. Do not close this tab.</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary py-2 px-4 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-primary py-2 px-4 text-sm"
          >
            Start Import
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ReviewForm ───────────────────────────────────────────────────────────────

/**
 * Stage 2 review form — validates defaults and triggers import.
 * Wrapped in a proper <form> element for native validation support.
 */
function ReviewForm({
  defaults,
  onDefaultsChange,
  selectedTree,
  selectedCount,
  onBack,
  onStartImport,
  isSubmitting,
}) {
  const [validationErrors, setValidationErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({});

  // Re-validate whenever defaults change (only for touched fields)
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const errors = validateDefaults(defaults);
      // Only show errors for touched fields
      const filteredErrors = {};
      Object.keys(errors).forEach((key) => {
        if (touched[key]) filteredErrors[key] = errors[key];
      });
      setValidationErrors(filteredErrors);
    }
  }, [defaults, touched]);

  const handleFieldTouch = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleDefaultsChange = useCallback(
    (field, value) => {
      onDefaultsChange(field, value);
      // Mark field as touched when it changes
      setTouched((prev) => ({ ...prev, [field]: true }));
    },
    [onDefaultsChange]
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark all fields as touched to show all errors
    setTouched({ price: true, stock: true, sizes: true });

    const errors = validateDefaults(defaults);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Find first error field and focus it
      const firstErrorField = Object.keys(errors)[0];
      const el = document.getElementById(`imp-${firstErrorField}`);
      if (el) el.focus();
      return;
    }

    if (selectedCount === 0) {
      return; // Button should be disabled, but guard anyway
    }

    setShowConfirm(true);
  };

  const handleConfirmImport = () => {
    setShowConfirm(false);
    onStartImport();
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
  };

  const hasErrors = Object.keys(validateDefaults(defaults)).length > 0;
  const canSubmit = !hasErrors && selectedCount > 0 && !isSubmitting;

  return (
    <>
      {showConfirm && (
        <ConfirmImportDialog
          categoryCount={selectedCount}
          onConfirm={handleConfirmImport}
          onCancel={handleCancelConfirm}
        />
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="Import configuration form"
        className="space-y-4"
      >
        {/* Defaults configuration card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-ink">Import Defaults</h3>
            <span className="text-xs text-ink-muted">
              Applied to all imported products
            </span>
          </div>
          <ImportDefaults
            defaults={defaults}
            onChange={handleDefaultsChange}
            onBlur={handleFieldTouch}
            disabled={isSubmitting}
            validationErrors={validationErrors}
          />
        </div>

        {/* Selected categories summary card */}
        <div className="card p-6">
          <h3 className="text-base font-bold text-ink mb-3">
            Selected Categories ({selectedTree.length})
          </h3>

          {selectedTree.length === 0 ? (
            <p className="text-sm text-ink-muted py-4 text-center">
              No categories selected. Go back and select at least one.
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {selectedTree.map((cat) => (
                <div
                  key={cat.id}
                  className="border border-line rounded-lg px-4 py-3"
                >
                  <div className="font-semibold text-sm text-ink">{cat.name}</div>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5" aria-label={`${cat.name} subcategories`}>
                      {cat.subcategories.map((sub) => (
                        <li
                          key={sub.id}
                          className="text-xs text-ink-muted pl-3 before:content-['–_'] before:text-ink-faint"
                        >
                          {sub.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-ink-muted mt-4">
            <span className="font-semibold text-ink">{selectedCount}</span>{' '}
            total categor{selectedCount !== 1 ? 'ies' : 'y'} selected.
            Images: up to 10 per product (big.jpg quality).
          </p>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="btn-secondary py-2.5 px-4 text-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="btn-ghost py-2.5 px-4 text-sm disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
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
                  Starting Import…
                </>
              ) : (
                <>
                  Start Import
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

// ─── YupooImportPage ──────────────────────────────────────────────────────────

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

  // Defaults — persisted to sessionStorage
  const [defaults, setDefaults] = useState(loadDefaults);

  // Crawl state
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlResult, setCrawlResult] = useState(null);
  const [crawlError, setCrawlError] = useState(null);

  // Block browser navigation during active import
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

  // ─── Fetch categories ────────────────────────────────────────────────────────

  const fetchCategories = useCallback(
    async (forceRefresh = false) => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const { categories: cats, cachedAt } = await getYupooCategories(forceRefresh);
        setCategories(cats);
        setLastFetched(cachedAt || new Date().toISOString());
      } catch (err) {
        const msg = err?.message || 'Failed to load categories. Please try again.';
        setCategoriesError(msg);
        toast.error(msg);
      } finally {
        setCategoriesLoading(false);
      }
    },
    [toast]
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Defaults handling ───────────────────────────────────────────────────────

  const handleDefaultsChange = useCallback((field, value) => {
    setDefaults((prev) => {
      const next = { ...prev, [field]: value };
      saveDefaults(next);
      return next;
    });
  }, []);

  // ─── Stage transitions ───────────────────────────────────────────────────────

  const handleProceedToReview = useCallback(() => {
    if (selected.size === 0) {
      toast.warning('Please select at least one category.');
      return;
    }
    setStage(STAGES.REVIEW);
  }, [selected.size, toast]);

  const handleBackToBrowse = useCallback(() => {
    if (crawlLoading) {
      if (!window.confirm('Import is running. Cancel it and go back?')) return;
    }
    setStage(STAGES.BROWSE);
    setCrawlResult(null);
    setCrawlError(null);
  }, [crawlLoading]);

  // ─── Import submission ───────────────────────────────────────────────────────

  /**
   * Executes the crawl API call. Called after user confirms in the dialog.
   * Transitions to IMPORT stage and submits POST /admin/yupoo/crawl.
   */
  const handleStartImport = useCallback(async () => {
    setStage(STAGES.IMPORT);
    setCrawlLoading(true);
    setCrawlResult(null);
    setCrawlError(null);

    // Build the selected category tree to send
    const selectedTree = buildSelectedTree(categories, selected);

    try {
      const res = await crawlCategories(selectedTree, defaults);
      const data = res?.data ?? res;
      setCrawlResult(data);

      const created = data?.created ?? 0;
      const skipped = data?.skipped ?? 0;
      const errCount = Array.isArray(data?.errors) ? data.errors.length : 0;

      if (created > 0) {
        toast.success(
          `Import complete! ${created} product${created !== 1 ? 's' : ''} created.`
        );
      } else if (errCount > 0) {
        toast.error(
          `Import finished with ${errCount} error${errCount !== 1 ? 's' : ''}.`
        );
      } else {
        toast.info(
          `Import finished. ${skipped} product${
            skipped !== 1 ? 's' : ''
          } skipped (duplicates).`
        );
      }
    } catch (err) {
      const msg = err?.message || 'Import failed. Please try again.';
      setCrawlError(msg);
      toast.error(msg);
    } finally {
      setCrawlLoading(false);
    }
  }, [categories, defaults, selected, toast]);

  const handleDone = useCallback(() => {
    setStage(STAGES.BROWSE);
    setCrawlResult(null);
    setCrawlError(null);
    setSelected(new Set());
  }, []);

  const handleViewProducts = useCallback(() => {
    navigate('/admin/inventory');
  }, [navigate]);

  // ─── Derived data ────────────────────────────────────────────────────────────

  const selectedTree = buildSelectedTree(categories, selected);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 page-enter">
      <StageIndicator stage={stage} />

      {/* ── Stage 1: Browse ── */}
      {stage === STAGES.BROWSE && (
        <div className="card p-6">
          <div className="flex flex-col" style={{ minHeight: 400 }}>
            <CategoryTree
              categories={categories}
              selected={selected}
              onSelectionChange={setSelected}
              loading={categoriesLoading}
              error={categoriesError}
              onRefresh={() => fetchCategories(true)}
              lastFetched={lastFetched}
            />
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
            <span className="text-sm text-ink-muted">
              {selected.size > 0 ? (
                <span>
                  <strong className="text-ink">{selected.size}</strong>{' '}
                  item{selected.size !== 1 ? 's' : ''} selected
                </span>
              ) : (
                'Select categories to import'
              )}
            </span>
            <button
              type="button"
              onClick={handleProceedToReview}
              disabled={selected.size === 0 || categoriesLoading}
              className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Review &amp; Import
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Stage 2: Review & Configure (form) ── */}
      {stage === STAGES.REVIEW && (
        <ReviewForm
          defaults={defaults}
          onDefaultsChange={handleDefaultsChange}
          selectedTree={selectedTree}
          selectedCount={selected.size}
          onBack={handleBackToBrowse}
          onStartImport={handleStartImport}
          isSubmitting={crawlLoading}
        />
      )}

      {/* ── Stage 3: Import Progress ── */}
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
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
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
            selectedCategories={selectedTree}
            onDone={handleDone}
            onViewProducts={handleViewProducts}
          />
        </div>
      )}
    </div>
  );
}

export default YupooImportPage;
