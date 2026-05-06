/**
 * Teams Page
 * Displays all World Cup 2026 teams in a responsive grid.
 * Includes search and group filter functionality.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Team Card component.
 */
function TeamCard({ team }) {
  return (
    <div className="card p-0 overflow-hidden group">
      {/* Flag / Image area */}
      <div className="bg-navy-deep aspect-square flex items-center justify-center p-8">
        <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
          {team.flag}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bebas text-2xl text-white tracking-wider">{team.name}</h3>
        <p className="text-ballers-muted text-sm mt-1">Group {team.group}</p>
        <p className="text-ballers-muted text-sm">{team.kitCount} kits available</p>

        <Link
          to={`/products/${team.id}`}
          className="btn-secondary w-full mt-4 text-sm py-2 text-center block"
          aria-label={`View ${team.name} kits`}
        >
          View Kits →
        </Link>
      </div>
    </div>
  );
}

/**
 * Skeleton card for loading state.
 */
function TeamCardSkeleton() {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="skeleton aspect-square" aria-hidden="true" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-6 w-3/4 rounded" aria-hidden="true" />
        <div className="skeleton h-4 w-1/2 rounded" aria-hidden="true" />
        <div className="skeleton h-4 w-2/3 rounded" aria-hidden="true" />
        <div className="skeleton h-10 w-full rounded-md" aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * Teams Page - main component.
 */
function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  // Placeholder teams data - will be replaced with API data in task 5
  const teams = [
    { id: '1', name: 'Brazil', code: 'BRA', flag: '🇧🇷', group: 'A', kitCount: 3 },
    { id: '2', name: 'Argentina', code: 'ARG', flag: '🇦🇷', group: 'B', kitCount: 3 },
    { id: '3', name: 'France', code: 'FRA', flag: '🇫🇷', group: 'C', kitCount: 2 },
    { id: '4', name: 'England', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'D', kitCount: 2 },
    { id: '5', name: 'Germany', code: 'GER', flag: '🇩🇪', group: 'E', kitCount: 2 },
    { id: '6', name: 'Spain', code: 'ESP', flag: '🇪🇸', group: 'F', kitCount: 3 },
    { id: '7', name: 'Portugal', code: 'POR', flag: '🇵🇹', group: 'G', kitCount: 2 },
    { id: '8', name: 'Netherlands', code: 'NED', flag: '🇳🇱', group: 'H', kitCount: 2 },
    { id: '9', name: 'Italy', code: 'ITA', flag: '🇮🇹', group: 'A', kitCount: 2 },
    { id: '10', name: 'USA', code: 'USA', flag: '🇺🇸', group: 'B', kitCount: 3 },
    { id: '11', name: 'Mexico', code: 'MEX', flag: '🇲🇽', group: 'C', kitCount: 2 },
    { id: '12', name: 'Japan', code: 'JPN', flag: '🇯🇵', group: 'D', kitCount: 2 },
  ];

  const groups = [...new Set(teams.map((t) => t.group))].sort();

  // Filter teams based on search and group
  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          team.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = !selectedGroup || team.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="page-enter min-h-screen">
      {/* Page Header */}
      <div className="bg-navy-surface border-b border-ballers-border py-12">
        <div className="container-ballers">
          <h1 className="font-bebas text-section text-white">WORLD CUP 2026 TEAMS</h1>
          <p className="text-ballers-muted mt-2 text-lg">48 nations. One tournament.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-navy border-b border-ballers-border py-4">
        <div className="container-ballers">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Group filter */}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="input-field sm:w-48"
              aria-label="Filter by group"
            >
              <option value="">All Groups</option>
              {groups.map((group) => (
                <option key={group} value={group}>Group {group}</option>
              ))}
            </select>

            {/* Search */}
            <div className="relative flex-1">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team..."
                className="input-field pl-10"
                aria-label="Search teams"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ballers-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="container-ballers py-12">
        {filteredTeams.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ballers-muted text-lg">No teams found matching your search.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedGroup(''); }}
              className="btn-secondary mt-4"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-ballers-muted text-sm mb-6">
              Showing {filteredTeams.length} of {teams.length} teams
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TeamsPage;
