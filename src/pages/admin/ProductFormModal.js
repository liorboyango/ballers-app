/**
 * ProductFormModal — Create-product dialog used by /admin/inventory.
 * Posts to /api/products via productsApi.createProduct.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createProduct } from '../../services/productsApi';
import { useTeams } from '../../hooks/useTeams';

const KIT_TYPES = ['home', 'away', 'third', 'goalkeeper'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const initialState = {
  name: '',
  price: '',
  teamId: '',
  kitType: 'home',
  stock: '',
  description: '',
  sponsor: '',
  season: '',
  sizes: ['M', 'L', 'XL'],
  isNew: false,
  isFeatured: false,
  customizable: true,
};

function ProductFormModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const dialogRef = useRef(null);
  const firstFieldRef = useRef(null);

  const { teams, loading: teamsLoading, error: teamsError } = useTeams({ limit: 100 });

  useEffect(() => {
    if (!open) return;
    setForm(initialState);
    setServerError('');
    setFieldErrors({});
    const t = setTimeout(() => firstFieldRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const teamOptions = useMemo(
    () =>
      [...teams].sort((a, b) =>
        (a.name || a.country || '').localeCompare(b.name || b.country || '')
      ),
    [teams]
  );

  if (!open) return null;

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleSize = (size) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const validate = () => {
    const errs = {};
    const name = form.name.trim();
    if (!name) errs.name = 'Product name is required';
    else if (name.length < 2) errs.name = 'Product name must be at least 2 characters';
    else if (name.length > 100) errs.name = 'Product name cannot exceed 100 characters';

    if (!form.teamId) errs.teamId = 'Team is required';
    if (!form.kitType) errs.kitType = 'Kit type is required';

    const priceNum = Number(form.price);
    if (!form.price || Number.isNaN(priceNum) || priceNum <= 0) {
      errs.price = 'Price must be a positive number';
    }

    if (form.sizes.length < 1) errs.sizes = 'At least one size must be selected';

    if (form.stock !== '') {
      const n = Number(form.stock);
      if (!Number.isInteger(n) || n < 0) {
        errs.stock = 'Stock must be a non-negative whole number';
      }
    }
    if (form.description.length > 2000) {
      errs.description = 'Description cannot exceed 2000 characters';
    }
    if (form.sponsor.length > 50) errs.sponsor = 'Sponsor cannot exceed 50 characters';
    if (form.season.length > 20) errs.season = 'Season cannot exceed 20 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      teamId: form.teamId,
      kitType: form.kitType,
      sizes: form.sizes,
      isNew: form.isNew,
      isFeatured: form.isFeatured,
      customizable: form.customizable,
    };
    if (form.stock !== '') payload.stock = Number(form.stock);
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.sponsor.trim()) payload.sponsor = form.sponsor.trim();
    if (form.season.trim()) payload.season = form.season.trim();

    setSubmitting(true);
    try {
      const result = await createProduct(payload);
      const created = result?.data || result?.product || result;
      onCreated?.(created);
      onClose?.();
    } catch (err) {
      if (Array.isArray(err?.errors) && err.errors.length) {
        const map = {};
        err.errors.forEach((e2) => {
          if (e2.field) map[e2.field] = e2.message;
        });
        setFieldErrors(map);
        setServerError(err.message || 'Failed to create product.');
      } else {
        setServerError(err?.message || 'Failed to create product.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onBackdropClick = (e) => {
    if (e.target === dialogRef.current) onClose?.();
  };

  const errCls = 'border-accent-danger focus:border-accent-danger focus:ring-accent-danger/30';

  return (
    <div
      ref={dialogRef}
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center px-4 py-8 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
    >
      <div className="bg-white rounded-xl shadow-elevated w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <h2 id="product-form-title" className="text-lg font-bold text-ink">
              Add New Product
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Create a new World Cup kit listing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-surface-muted text-ink-faint hover:text-ink"
            aria-label="Close"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4" noValidate>
          {serverError && (
            <div role="alert" className="p-3 rounded-md bg-red-50 border border-red-200 text-accent-danger text-sm">
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="pf-name" className="block text-xs font-semibold text-ink-soft mb-1">
              Product Name <span className="text-accent-danger">*</span>
            </label>
            <input
              ref={firstFieldRef}
              id="pf-name"
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Brazil Home Kit '24"
              className={`input-field w-full text-sm ${fieldErrors.name ? errCls : ''}`}
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && (
              <p className="text-xs text-accent-danger mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-team" className="block text-xs font-semibold text-ink-soft mb-1">
                Team <span className="text-accent-danger">*</span>
              </label>
              <select
                id="pf-team"
                value={form.teamId}
                onChange={(e) => update('teamId', e.target.value)}
                className={`input-field w-full text-sm ${fieldErrors.teamId ? errCls : ''}`}
                aria-invalid={!!fieldErrors.teamId}
                disabled={teamsLoading}
              >
                <option value="">
                  {teamsLoading
                    ? 'Loading teams…'
                    : teamsError
                    ? 'Failed to load teams'
                    : teamOptions.length === 0
                    ? 'No teams available'
                    : 'Select a team'}
                </option>
                {teamOptions.map((t) => (
                  <option key={t._id || t.id} value={t._id || t.id}>
                    {t.name || t.country}
                  </option>
                ))}
              </select>
              {teamsError && (
                <p className="text-xs text-accent-danger mt-1">{teamsError}</p>
              )}
              {fieldErrors.teamId && (
                <p className="text-xs text-accent-danger mt-1">{fieldErrors.teamId}</p>
              )}
            </div>

            <div>
              <label htmlFor="pf-kitType" className="block text-xs font-semibold text-ink-soft mb-1">
                Kit Type <span className="text-accent-danger">*</span>
              </label>
              <select
                id="pf-kitType"
                value={form.kitType}
                onChange={(e) => update('kitType', e.target.value)}
                className={`input-field w-full text-sm ${fieldErrors.kitType ? errCls : ''}`}
                aria-invalid={!!fieldErrors.kitType}
              >
                {KIT_TYPES.map((k) => (
                  <option key={k} value={k}>
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </option>
                ))}
              </select>
              {fieldErrors.kitType && (
                <p className="text-xs text-accent-danger mt-1">{fieldErrors.kitType}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-price" className="block text-xs font-semibold text-ink-soft mb-1">
                Price (USD) <span className="text-accent-danger">*</span>
              </label>
              <input
                id="pf-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                placeholder="120.00"
                className={`input-field w-full text-sm ${fieldErrors.price ? errCls : ''}`}
                aria-invalid={!!fieldErrors.price}
              />
              {fieldErrors.price && (
                <p className="text-xs text-accent-danger mt-1">{fieldErrors.price}</p>
              )}
            </div>

            <div>
              <label htmlFor="pf-stock" className="block text-xs font-semibold text-ink-soft mb-1">
                Stock
              </label>
              <input
                id="pf-stock"
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                value={form.stock}
                onChange={(e) => update('stock', e.target.value)}
                placeholder="0"
                className={`input-field w-full text-sm ${fieldErrors.stock ? errCls : ''}`}
                aria-invalid={!!fieldErrors.stock}
              />
              {fieldErrors.stock && (
                <p className="text-xs text-accent-danger mt-1">{fieldErrors.stock}</p>
              )}
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-ink-soft mb-1.5">
              Sizes <span className="text-accent-danger">*</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => {
                const active = form.sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    aria-pressed={active}
                    className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-ink-soft border-line hover:border-brand hover:text-brand'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {fieldErrors.sizes && (
              <p className="text-xs text-accent-danger mt-1">{fieldErrors.sizes}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-sponsor" className="block text-xs font-semibold text-ink-soft mb-1">
                Sponsor
              </label>
              <input
                id="pf-sponsor"
                type="text"
                value={form.sponsor}
                onChange={(e) => update('sponsor', e.target.value)}
                placeholder="e.g. Nike"
                maxLength={50}
                className={`input-field w-full text-sm ${fieldErrors.sponsor ? errCls : ''}`}
                aria-invalid={!!fieldErrors.sponsor}
              />
              {fieldErrors.sponsor && (
                <p className="text-xs text-accent-danger mt-1">{fieldErrors.sponsor}</p>
              )}
            </div>

            <div>
              <label htmlFor="pf-season" className="block text-xs font-semibold text-ink-soft mb-1">
                Season
              </label>
              <input
                id="pf-season"
                type="text"
                value={form.season}
                onChange={(e) => update('season', e.target.value)}
                placeholder="e.g. 2024/25"
                maxLength={20}
                className={`input-field w-full text-sm ${fieldErrors.season ? errCls : ''}`}
                aria-invalid={!!fieldErrors.season}
              />
              {fieldErrors.season && (
                <p className="text-xs text-accent-danger mt-1">{fieldErrors.season}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="pf-description" className="block text-xs font-semibold text-ink-soft mb-1">
              Description
            </label>
            <textarea
              id="pf-description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Optional product description…"
              rows={3}
              maxLength={2000}
              className={`input-field w-full text-sm resize-y ${fieldErrors.description ? errCls : ''}`}
              aria-invalid={!!fieldErrors.description}
            />
            {fieldErrors.description && (
              <p className="text-xs text-accent-danger mt-1">{fieldErrors.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            <label className="inline-flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={form.customizable}
                onChange={(e) => update('customizable', e.target.checked)}
                className="rounded border-line text-brand focus:ring-brand"
              />
              <span>Customizable</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => update('isNew', e.target.checked)}
                className="rounded border-line text-brand focus:ring-brand"
              />
              <span>New</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => update('isFeatured', e.target.checked)}
                className="rounded border-line text-brand focus:ring-brand"
              />
              <span>Featured</span>
            </label>
          </div>
        </form>

        <footer className="flex items-center justify-end gap-2 px-6 py-4 border-t border-line bg-surface-muted/40 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary py-2 px-4 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary py-2 px-4 text-sm"
          >
            {submitting ? 'Creating…' : 'Create Product'}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ProductFormModal;
