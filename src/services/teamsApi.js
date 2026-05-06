/**
 * Teams API Service
 * Handles all team-related API calls.
 */
import apiClient from './api';

/**
 * Fetch all teams with optional filters
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.group] - Filter by group (A-H)
 * @param {string} [params.search] - Search term
 * @param {string} [params.sort] - Sort field
 * @returns {Promise<{data: Team[], pagination: Object}>}
 */
export const getTeams = async (params = {}) => {
  const response = await apiClient.get('/teams', { params });
  return response.data;
};

/**
 * Fetch a single team by ID
 * @param {string} id - Team ID
 * @returns {Promise<{data: Team}>}
 */
export const getTeamById = async (id) => {
  const response = await apiClient.get(`/teams/${id}`);
  return response.data;
};

/**
 * Fetch a team by slug
 * @param {string} slug - Team slug
 * @returns {Promise<{data: Team}>}
 */
export const getTeamBySlug = async (slug) => {
  const response = await apiClient.get(`/teams/slug/${slug}`);
  return response.data;
};
