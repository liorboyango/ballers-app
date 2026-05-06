import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * TeamCard component
 * Displays a single team with flag, name, group, and kit count.
 * Used in the Teams page grid.
 */
const TeamCard = ({ team }) => {
  const navigate = useNavigate();

  if (!team) return null;

  const { _id, name, country, flag, group, productCount = 0 } = team;

  const flagUrl = flag
    ? flag.startsWith('http')
      ? flag
      : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${flag}`
    : null;

  const displayName = name || country || 'Unknown Team';

  const handleClick = () => {
    navigate(`/products?teamId=${_id}`);
  };

  return (
    <article
      className="team-card group bg-surface border border-ballers-border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-gold hover:shadow-gold-glow"
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`${displayName} - View kits`}
    >
      {/* Flag / Image */}
      <div className="relative overflow-hidden bg-navy-deep" style={{ aspectRatio: '16/9' }}>
        {flagUrl ? (
          <img
            src={flagUrl}
            alt={`${displayName} flag`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        {/* Fallback flag emoji / initials */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-navy-deep"
          style={{ display: flagUrl ? 'none' : 'flex' }}
          aria-hidden="true"
        >
          <span className="text-4xl font-bold text-gold font-bebas">
            {displayName.slice(0, 3).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        <h3 className="text-white font-bold text-xl font-bebas tracking-wide uppercase">
          {displayName}
        </h3>
        {group && (
          <p className="text-ballers-muted text-xs uppercase tracking-wider mt-0.5">
            Group {group}
          </p>
        )}
        <p className="text-ballers-muted text-sm mt-1">
          {productCount} {productCount === 1 ? 'kit' : 'kits'} available
        </p>

        {/* CTA */}
        <div className="mt-3 flex items-center gap-1 text-gold text-sm font-semibold group-hover:gap-2 transition-all duration-200">
          <span>View Kits</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </article>
  );
};

export default TeamCard;
