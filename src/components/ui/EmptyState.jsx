/**
 * EmptyState Component
 * Displays a friendly empty state message when no data is available.
 */
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * @param {Object} props
 * @param {string} [props.title='Nothing here yet'] - Main heading
 * @param {string} [props.message] - Descriptive message
 * @param {string} [props.icon] - Emoji or icon character
 * @param {string} [props.actionLabel] - CTA button label
 * @param {string} [props.actionTo] - CTA link destination
 * @param {Function} [props.onAction] - CTA click handler
 * @param {string} [props.className] - Additional CSS classes
 */
const EmptyState = ({
  title = 'Nothing here yet',
  message,
  icon = '📦',
  actionLabel,
  actionTo,
  onAction,
  className = '',
}) => (
  <div
    className={`
      flex flex-col items-center justify-center gap-4 py-16 px-8 text-center
      ${className}
    `}
  >
    <span className="text-6xl" role="img" aria-hidden="true">{icon}</span>
    <div>
      <h3 className="text-white font-bold text-xl mb-2">{title}</h3>
      {message && <p className="text-ballers-muted text-sm max-w-sm">{message}</p>}
    </div>
    {(actionLabel && actionTo) && (
      <Link
        to={actionTo}
        className="
          px-6 py-3 bg-gold text-navy font-bold uppercase tracking-wider
          rounded-md hover:bg-gold-hover transition-colors text-sm
        "
      >
        {actionLabel}
      </Link>
    )}
    {(actionLabel && onAction && !actionTo) && (
      <button
        onClick={onAction}
        className="
          px-6 py-3 bg-gold text-navy font-bold uppercase tracking-wider
          rounded-md hover:bg-gold-hover transition-colors text-sm
        "
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
