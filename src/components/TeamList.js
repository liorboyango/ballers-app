import React, { useState, useEffect, useCallback } from 'react';
import TeamCard from './TeamCard';
import TeamCardSkeleton from './TeamCardSkeleton';
import { teamsAPI } from '../services/api';

/**
 * TeamList component
 * Fetches and displays a grid of team cards with search and group filter.
 * Supports pagination and responsive grid layout.
 */
const TeamList = ({ limit, showFilters = true, compact = false }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: limit || 12 };
      if (search) params.search = search;
      if (group) params.group = group;

      const response = await teamsAPI.getAll(params);
      setTeams(response.data.data || []);
      setPagination(response.data.pagination || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load teams. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, group, limit]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, group]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleGroupChange = (e) => {
    setGroup(e.target.value);
  };

  return (
    <section className="team-list" aria-label="World Cup Teams">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Group Filter */}
          <div className="relative">
            <select
              value={group}
              onChange={handleGroupChange}
              className="appearance-none bg-navy border border-ballers-border text-white rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 cursor-pointer"
              aria-label="Filter by group"
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  Group {g}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ballers-muted pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search team..."
              className="w-full bg-navy border border-ballers-border text-white placeholder-ballers-muted rounded-lg px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
              aria-label="Search teams"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ballers-muted pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className="bg-ballers-red/10 border border-ballers-red/30 text-ballers-red rounded-lg p-4 mb-6"
          role="alert"
        >
          <p className="font-semibold">Error loading teams</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchTeams}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Teams Grid */}
      <div
        className={`grid gap-6 ${
          compact
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        }`}
      >
        {loading
          ? Array.from({ length: limit || 8 }).map((_, i) => (
              <TeamCardSkeleton key={i} />
            ))
          : teams.map((team) => <TeamCard key={team._id} team={team} />)}
      </div>

      {/* Empty State */}
      {!loading && !error && teams.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4" aria-hidden="true">⚽</div>
          <h3 className="text-white font-bold text-xl mb-2">No teams found</h3>
          <p className="text-ballers-muted">
            {search || group
              ? 'Try adjusting your filters'
              : 'No teams available yet'}
          </p>
          {(search || group) && (
            <button
              onClick={() => {
                setSearch('');
                setGroup('');
              }}
              className="mt-4 text-gold underline hover:no-underline text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevPage}
            className="px-4 py-2 rounded-lg border border-ballers-border text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-gold hover:text-gold transition-colors"
            aria-label="Previous page"
          >
            ← Prev
          </button>

          <div className="flex gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - page) <= 1
              )
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 py-2 text-ballers-muted">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-lg border text-sm font-semibold transition-colors ${
                      page === p
                        ? 'bg-gold text-navy border-gold'
                        : 'border-ballers-border text-white hover:border-gold hover:text-gold'
                    }`}
                    aria-label={`Page ${p}`}
                    aria-current={page === p ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 rounded-lg border border-ballers-border text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-gold hover:text-gold transition-colors"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
};

export default TeamList;
