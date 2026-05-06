import React from 'react';

/**
 * TeamCardSkeleton component
 * Pulsing skeleton placeholder for team cards during loading.
 */
const TeamCardSkeleton = () => {
  return (
    <div
      className="team-card-skeleton bg-surface border border-ballers-border rounded-xl overflow-hidden animate-pulse"
      aria-hidden="true"
    >
      {/* Flag skeleton */}
      <div className="bg-navy-deep w-full" style={{ aspectRatio: '16/9' }} />

      {/* Content skeleton */}
      <div className="p-4 flex flex-col gap-2">
        <div className="h-5 bg-navy-deep rounded w-2/3" />
        <div className="h-3 bg-navy-deep rounded w-1/3" />
        <div className="h-3 bg-navy-deep rounded w-1/2" />
        <div className="h-4 bg-navy-deep rounded w-1/4 mt-1" />
      </div>
    </div>
  );
};

export default TeamCardSkeleton;
