/**
 * ImportDefaults
 * Configures the default values applied to all products imported from the supplier:
 * price, kitType, stock, and sizes.
 *
 * Updated in Task 3 to:
 * - Accept and display per-field validation errors (from parent form)
 * - Expose onBlur prop to notify parent when a field loses focus (for "touched" tracking)
 * - Add aria-describedby links between inputs and their error messages
 *
 * @param {Object} props
 * @param {Object} props.defaults - Current defaults state
 * @param {function} props.onChange - (field: string, value: any) => void
 * @param {function} [props.onBlur] - (field: string) => void — called when a field blurs
 * @param {boolean} [props.disabled] - Disable all inputs (during import)
 * @param {Object} [props.validationErrors] - Map of field → error message string
 */
import React from 'react';

const KIT_TYPES = [
  { value: 'home', label: 'Home' },
  { value: 'away', label: 'Away' },
  { value: 'third', label: 'Third' },
  { value: 'goalkeeper', label: 'Goalkeeper' },
];

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/**
 * Inline field error message with accessible role.
 */
function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className="mt-1 text-xs text-accent-danger flex items-center gap-1"
    >
      <svg
        className="w-3 h-3 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {message}
    </p>
  );
}

function ImportDefaults({
  defaults,
  onChange,
  onBlur,
  disabled = false,
  validationErrors = {},
}) {
  const toggleSize = (size) => {
    const current = defaults.sizes || [];
    const next = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    onChange('sizes', next);
    // Notify parent that sizes field was interacted with
    if (onBlur) onBlur('sizes');
  };

  const handleBlur = (field) => {
    if (onBlur) onBlur(field);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-muted">
        These defaults will be applied to every product imported from the selected categories.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* ── Price ── */}
        <div>
          <label
            htmlFor="imp-price"
            className="block text-xs font-semibold text-ink-soft mb-1"
          >
            Price (USD){' '}
            <span className="text-accent-danger" aria-hidden="true">*</span>
          </label>
          <input
            id="imp-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={defaults.price}
            onChange={(e) =>
              onChange('price', parseFloat(e.target.value) || 0)
            }
            onBlur={() => handleBlur('price')}
            disabled={disabled}
            required
            aria-required="true"
            aria-invalid={!!validationErrors.price}
            aria-describedby={
              validationErrors.price ? 'imp-price-error' : undefined
            }
            className={`input-field w-full text-sm ${
              validationErrors.price ? 'border-accent-danger focus:ring-accent-danger/30' : ''
            }`}
            aria-label="Default price in USD"
          />
          <FieldError id="imp-price-error" message={validationErrors.price} />
        </div>

        {/* ── Kit Type ── */}
        <div>
          <label
            htmlFor="imp-kitType"
            className="block text-xs font-semibold text-ink-soft mb-1"
          >
            Kit Type
          </label>
          <select
            id="imp-kitType"
            value={defaults.kitType}
            onChange={(e) => onChange('kitType', e.target.value)}
            onBlur={() => handleBlur('kitType')}
            disabled={disabled}
            className="input-field w-full text-sm"
            aria-label="Default kit type"
          >
            {KIT_TYPES.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Stock ── */}
        <div>
          <label
            htmlFor="imp-stock"
            className="block text-xs font-semibold text-ink-soft mb-1"
          >
            Stock
          </label>
          <input
            id="imp-stock"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            value={defaults.stock}
            onChange={(e) =>
              onChange('stock', parseInt(e.target.value, 10) || 0)
            }
            onBlur={() => handleBlur('stock')}
            disabled={disabled}
            aria-invalid={!!validationErrors.stock}
            aria-describedby={
              validationErrors.stock ? 'imp-stock-error' : undefined
            }
            className={`input-field w-full text-sm ${
              validationErrors.stock ? 'border-accent-danger focus:ring-accent-danger/30' : ''
            }`}
            aria-label="Default stock quantity"
          />
          <FieldError id="imp-stock-error" message={validationErrors.stock} />
        </div>
      </div>

      {/* ── Sizes ── */}
      <div>
        <span
          className="block text-xs font-semibold text-ink-soft mb-1.5"
          id="imp-sizes-label"
        >
          Sizes{' '}
          <span className="text-accent-danger" aria-hidden="true">*</span>
        </span>
        <div
          role="group"
          aria-labelledby="imp-sizes-label"
          aria-describedby={
            validationErrors.sizes ? 'imp-sizes-error' : undefined
          }
          className="flex flex-wrap gap-2"
        >
          {AVAILABLE_SIZES.map((size) => {
            const active = (defaults.sizes || []).includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                disabled={disabled}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    active
                      ? 'bg-brand text-white border-brand'
                      : validationErrors.sizes
                      ? 'bg-white text-ink-soft border-accent-danger/50 hover:border-brand hover:text-brand'
                      : 'bg-white text-ink-soft border-line hover:border-brand hover:text-brand'
                  }`}
              >
                {size}
              </button>
            );
          })}
        </div>
        <FieldError id="imp-sizes-error" message={validationErrors.sizes} />
      </div>
    </div>
  );
}

export default ImportDefaults;
