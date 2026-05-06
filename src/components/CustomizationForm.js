import React, { useState, useEffect } from 'react';

/**
 * CustomizationForm component
 * Allows users to customize their jersey with:
 * - Jersey number (1-99)
 * - Player name / sponsor text
 * - Size selection
 * Includes a live jersey preview panel.
 */
const CustomizationForm = ({ product, onCustomizationChange, initialValues = {} }) => {
  const [number, setNumber] = useState(initialValues.number || '');
  const [name, setName] = useState(initialValues.name || '');
  const [size, setSize] = useState(initialValues.size || '');
  const [errors, setErrors] = useState({});

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Notify parent of changes
  useEffect(() => {
    if (onCustomizationChange) {
      onCustomizationChange({ number, name, size });
    }
  }, [number, name, size, onCustomizationChange]);

  const validateNumber = (val) => {
    if (!val) return '';
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1 || num > 99) {
      return 'Number must be between 1 and 99';
    }
    return '';
  };

  const validateName = (val) => {
    if (!val) return '';
    if (val.length > 20) return 'Name must be 20 characters or less';
    if (!/^[a-zA-Z0-9\s'-]+$/.test(val)) return 'Name contains invalid characters';
    return '';
  };

  const handleNumberChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setNumber(val);
    setErrors((prev) => ({ ...prev, number: validateNumber(val) }));
  };

  const handleNameChange = (e) => {
    const val = e.target.value.toUpperCase();
    setName(val);
    setErrors((prev) => ({ ...prev, name: validateName(val) }));
  };

  const handleSizeSelect = (s) => {
    setSize(s);
    setErrors((prev) => ({ ...prev, size: '' }));
  };

  const teamName =
    product?.team && typeof product.team === 'object'
      ? product.team.name || product.team.country || ''
      : '';

  const primaryColor = product?.primaryColor || '#1A1A2E';
  const accentColor = product?.accentColor || '#E8C547';

  return (
    <div className="customization-form" aria-label="Jersey customization">
      {/* Live Jersey Preview */}
      <div
        className="jersey-preview bg-surface border border-ballers-border rounded-xl p-6 mb-6 text-center"
        aria-live="polite"
        aria-label="Jersey preview"
      >
        <p className="text-ballers-muted text-xs uppercase tracking-widest mb-3">Preview</p>

        {/* Jersey SVG mockup */}
        <div className="relative inline-block">
          <svg
            viewBox="0 0 200 220"
            className="w-40 h-44 mx-auto"
            aria-hidden="true"
          >
            {/* Jersey body */}
            <path
              d="M60 20 L20 60 L40 70 L40 200 L160 200 L160 70 L180 60 L140 20 L120 35 Q100 45 80 35 Z"
              fill={primaryColor}
              stroke={accentColor}
              strokeWidth="2"
            />
            {/* Collar */}
            <path
              d="M80 35 Q100 50 120 35"
              fill="none"
              stroke={accentColor}
              strokeWidth="3"
            />
            {/* Sleeves */}
            <path
              d="M60 20 L20 60 L40 70 L60 50 Z"
              fill={primaryColor}
              stroke={accentColor}
              strokeWidth="1.5"
            />
            <path
              d="M140 20 L180 60 L160 70 L140 50 Z"
              fill={primaryColor}
              stroke={accentColor}
              strokeWidth="1.5"
            />
          </svg>

          {/* Number overlay */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ paddingTop: '30px' }}
          >
            <span
              className="jersey-number font-mono font-bold leading-none"
              style={{
                fontSize: number ? '48px' : '32px',
                color: accentColor,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                minHeight: '56px',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label={number ? `Jersey number ${number}` : 'No number selected'}
            >
              {number || '—'}
            </span>
            {name && (
              <span
                className="text-xs font-bold tracking-widest uppercase mt-1"
                style={{ color: accentColor, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                aria-label={`Name: ${name}`}
              >
                {name}
              </span>
            )}
          </div>
        </div>

        {teamName && (
          <p className="text-ballers-muted text-xs mt-2 uppercase tracking-wider">{teamName}</p>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {/* Jersey Number */}
        <div>
          <label
            htmlFor="jersey-number"
            className="block text-white text-sm font-semibold mb-1.5"
          >
            Jersey Number
            <span className="text-ballers-muted font-normal ml-1">(optional, 1–99)</span>
          </label>
          <input
            id="jersey-number"
            type="text"
            inputMode="numeric"
            value={number}
            onChange={handleNumberChange}
            placeholder="e.g. 10"
            maxLength={2}
            className={`w-full bg-navy border rounded-lg px-4 py-3 text-white placeholder-ballers-muted text-sm focus:outline-none transition-colors ${
              errors.number
                ? 'border-ballers-red focus:border-ballers-red'
                : 'border-ballers-border focus:border-gold focus:ring-1 focus:ring-gold/30'
            }`}
            aria-describedby={errors.number ? 'number-error' : undefined}
            aria-invalid={!!errors.number}
          />
          {errors.number && (
            <p id="number-error" className="text-ballers-red text-xs mt-1" role="alert">
              {errors.number}
            </p>
          )}
        </div>

        {/* Player Name */}
        <div>
          <label
            htmlFor="player-name"
            className="block text-white text-sm font-semibold mb-1.5"
          >
            Name / Sponsor
            <span className="text-ballers-muted font-normal ml-1">(optional, max 20 chars)</span>
          </label>
          <input
            id="player-name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. MESSI"
            maxLength={20}
            className={`w-full bg-navy border rounded-lg px-4 py-3 text-white placeholder-ballers-muted text-sm focus:outline-none transition-colors uppercase ${
              errors.name
                ? 'border-ballers-red focus:border-ballers-red'
                : 'border-ballers-border focus:border-gold focus:ring-1 focus:ring-gold/30'
            }`}
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p id="name-error" className="text-ballers-red text-xs mt-1" role="alert">
              {errors.name}
            </p>
          )}
          <p className="text-ballers-muted text-xs mt-1">
            {name.length}/20 characters
          </p>
        </div>

        {/* Size Selector */}
        <div>
          <label className="block text-white text-sm font-semibold mb-2">
            Size
            <span className="text-ballers-red ml-1" aria-hidden="true">*</span>
          </label>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Select jersey size"
            aria-required="true"
          >
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSizeSelect(s)}
                className={`size-selector px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-150 ${
                  size === s
                    ? 'bg-gold text-navy border-gold'
                    : 'border-ballers-border text-ballers-muted hover:border-gold hover:text-white'
                }`}
                aria-pressed={size === s}
                aria-label={`Size ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.size && (
            <p className="text-ballers-red text-xs mt-1" role="alert">
              {errors.size}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomizationForm;
