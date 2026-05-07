/**
 * ImportDefaults
 * Configures the default values applied to all products imported from Yupoo:
 * price, kitType, stock, and sizes.
 *
 * @param {Object} props
 * @param {Object} props.defaults - Current defaults state
 * @param {function} props.onChange - (field: string, value: any) => void
 * @param {boolean} [props.disabled] - Disable all inputs (during import)
 */
import React from 'react';

const KIT_TYPES = [
  { value: 'home', label: 'Home' },
  { value: 'away', label: 'Away' },
  { value: 'third', label: 'Third' },
  { value: 'goalkeeper', label: 'Goalkeeper' },
];

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function ImportDefaults({ defaults, onChange, disabled = false }) {
  const toggleSize = (size) => {
    const current = defaults.sizes || [];
    const next = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    onChange('sizes', next);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-muted">
        These defaults will be applied to every product imported from the selected categories.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Price */}
        <div>
          <label htmlFor="imp-price" className="block text-xs font-semibold text-ink-soft mb-1">
            Price (USD) <span className="text-accent-danger">*</span>
          </label>
          <input
            id="imp-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={defaults.price}
            onChange={(e) => onChange('price', parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className="input-field w-full text-sm"
            aria-label="Default price"
          />
        </div>

        {/* Kit Type */}
        <div>
          <label htmlFor="imp-kitType" className="block text-xs font-semibold text-ink-soft mb-1">
            Kit Type
          </label>
          <select
            id="imp-kitType"
            value={defaults.kitType}
            onChange={(e) => onChange('kitType', e.target.value)}
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

        {/* Stock */}
        <div>
          <label htmlFor="imp-stock" className="block text-xs font-semibold text-ink-soft mb-1">
            Stock
          </label>
          <input
            id="imp-stock"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            value={defaults.stock}
            onChange={(e) => onChange('stock', parseInt(e.target.value, 10) || 0)}
            disabled={disabled}
            className="input-field w-full text-sm"
            aria-label="Default stock"
          />
        </div>
      </div>

      {/* Sizes */}
      <div>
        <span className="block text-xs font-semibold text-ink-soft mb-1.5">Sizes</span>
        <div className="flex flex-wrap gap-2">
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
                      : 'bg-white text-ink-soft border-line hover:border-brand hover:text-brand'
                  }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ImportDefaults;
