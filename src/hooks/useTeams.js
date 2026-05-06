/**
 * useTeams Hook
 * Custom hook for fetching teams data with loading and error states.
 */
import { useState, useEffect, useCallback } from 'react';
import { getTeams, getTeamById } from '../services/teamsApi';

/**
 * Hook to fetch a list of teams
 * @param {Object} initialParams - Initial query parameters
 * @returns {Object} - { teams, pagination, loading, error, refetch, setParams }
 */
export const useTeams = (initialParams = {}) => {
  const [teams, setTeams] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTeams(params);
      setTeams(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load teams');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return {
    teams,
    pagination,
    loading,
    error,
    refetch: fetchTeams,
    setParams,
  };
};

/**
 * Hook to fetch a single team by ID
 * @param {string} id - Team ID
 * @returns {Object} - { team, loading, error, refetch }
 */
export const useTeam = (id) => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeam = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getTeamById(id);
      setTeam(result.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load team');
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return { team, loading, error, refetch: fetchTeam };
};

export default useTeams;
