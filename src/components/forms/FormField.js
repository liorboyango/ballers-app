/**
 * Reusable form field components with consistent styling.
 * Wraps inputs, selects, and textareas with label and error display.
 */
import React from 'react';

/**
 * FormInput - A styled text/email/password input with label and error message.
 *
 * @param {object} props
 * @param {string} props.label - Field label text
 * @param {string} props.id - Input id (also used for htmlFor)
 * @param {string} [props.error] - Validation error message
 * @param {string} [props.hint] - Optional hint text below input
 * @param {React.Ref} ref - Forwarded ref for React Hook Form
 */
export const FormInput = React.forwardRef(function FormInput(
  { label, id, error, hint, className = '', ...rest },
  ref
) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-white"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full px-4 py-3 rounded-lg bg-[#1A1A2E] border text-white placeholder-[#A8B2C1] text-sm transition-colors focus:outline-none focus:ring-1 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
            : 'border-[#2A3550] focus:border-[#E8C547] focus:ring-[#E8C547]/30'
        }`}
        {...rest}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-[#A8B2C1]">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-red-400 flex items-center gap-1"
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
          {error}
        </p>
      )}
    </div>
  );
});

/**
 * FormSelect - A styled select dropdown with label and error message.
 */
export const FormSelect = React.forwardRef(function FormSelect(
  { label, id, error, options = [], className = '', ...rest },
  ref
) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-white">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full px-4 py-3 rounded-lg bg-[#1A1A2E] border text-white text-sm transition-colors focus:outline-none focus:ring-1 appearance-none cursor-pointer ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
            : 'border-[#2A3550] focus:border-[#E8C547] focus:ring-[#E8C547]/30'
        }`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#1A1A2E]">
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-red-400 flex items-center gap-1"
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
          {error}
        </p>
      )}
    </div>
  );
});

/**
 * SectionHeading - Numbered section heading for multi-step forms.
 */
export function SectionHeading({ number, title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-7 h-7 rounded-full bg-[#E8C547] text-[#1A1A2E] text-sm font-bold flex items-center justify-center flex-shrink-0">
        {number}
      </span>
      <h2 className="text-lg font-bold text-white uppercase tracking-wider">
        {title}
      </h2>
    </div>
  );
}
