/**
 * TeamsPage
 * Displays all World Cup 2026 teams with search and group filtering.
 * Fetches data from GET /api/teams with loading/error states.
 */
import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTeams } from '../hooks/useTeams';
import { LoadingSpinner, ErrorMessage, SkeletonGrid, EmptyState } from '../components/ui';
import { API_BASE_URL } from '../services/api';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * TeamCard component
 */
const TeamCard = ({ team }) => {
  const flagUrl = team.flag
    ? `${API_BASE_URL.replace('/api', '')}${team.flag}`
    : null;

  return (
    <Link
      to={`/products?teamId=${team._id}`}
      className="
        group block bg-navy-surface border border-ballers-border rounded-xl overflow-hidden
        hover:border-gold hover:shadow-[0_8px_32px_rgba(232,197,71,0.15)]
        transition-all duration-300
      "
      aria-label={`View ${team.name} kits`}
    >
      {/* Flag image */}
      <div className="relative h-40 bg-navy-deep overflow-hidden">
        {flagUrl ? (
          <img
            src={flagUrl}
            alt={`${team.name} flag`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl" role="img" aria-label={team.country}>
              {team.flagEmoji || '🏁'}
            </span>
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-4">
        <h3 className="font-bebas text-2xl text-white tracking-wide mb-1">
          {team.name}
        </h3>
        {team.group && (
          <p className="text-ballers-muted text-sm mb-1">Group {team.group}</p>
        )}
        {team.productCount !== undefined && (
          <p className="text-ballers-muted text-sm mb-3">
            {team.productCount} {team.productCount === 1 ? 'kit' : 'kits'} available
          </p>
        )}
        <span
          className="
            inline-flex items-center gap-1 text-gold text-sm font-semibold
            group-hover:gap-2 transition-all duration-200
          "
        >
          View Kits
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
};

/**
 * TeamsPage component
 */
const TeamsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  const { teams, loading, error, refetch, setParams } = useTeams({ limit: 48 });

  const handleSearch = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      setParams((prev) => ({ ...prev, search: value || undefined, page: 1 }));
    },
    [setParams]
  );

  const handleGroupFilter = useCallback(
    (group) => {
      const newGroup = selectedGroup === group ? '' : group;
      setSelectedGroup(newGroup);
      setParams((prev) => ({ ...prev, group: newGroup || undefined, page: 1 }));
    },
    [selectedGroup, setParams]
  );

  return (
    <main className="min-h-screen bg-navy pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="font-bebas text-5xl sm:text-6xl text-white tracking-wide mb-2">
            World Cup 2026 Teams
          </h1>
          <p className="text-ballers-muted text-lg">
            48 nations. One tournament.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ballers-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search team..."
              value={searchTerm}
              onChange={handleSearch}
              className="
                w-full pl-10 pr-4 py-3 bg-navy-surface border border-ballers-border
                rounded-lg text-white placeholder-ballers-muted
                focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30
                transition-colors
              "
              aria-label="Search teams"
            />
          </div>

          {/* Group filter */}
          <div className="flex flex-wrap gap-2">
            {GROUPS.map((group) => (
              <button
                key={group}
                onClick={() => handleGroupFilter(group)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-semibold border transition-colors
                  ${
                    selectedGroup === group
                      ? 'bg-gold text-navy border-gold'
                      : 'border-ballers-border text-ballers-muted hover:border-gold hover:text-white'
                  }
                `}
                aria-pressed={selectedGroup === group}
              >
                Group {group}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonGrid count={12} variant="team" />
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={refetch}
            className="py-20"
          />
        ) : teams.length === 0 ? (
          <EmptyState
            title="No teams found"
            message="Try adjusting your search or filter criteria."
            icon="🏁"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {teams.map((team) => (
              <TeamCard key={team._id} team={team} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default TeamsPage;
