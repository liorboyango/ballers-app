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
 * Fetch every team across all pages by walking the paginated endpoint.
 * Backend caps `limit` at 100 per page, so callers needing the full list
 * (e.g. an admin dropdown) must paginate.
 * @param {Object} params - Query parameters (page/limit are managed internally)
 * @returns {Promise<{data: Team[], pagination: Object}>}
 */
export const getAllTeams = async (params = {}) => {
  const pageSize = 100;
  const { page: _ignoredPage, limit: _ignoredLimit, ...rest } = params;
  const first = await getTeams({ ...rest, page: 1, limit: pageSize });
  const totalPages = first?.pagination?.totalPages ?? 1;
  if (totalPages <= 1) return first;

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      getTeams({ ...rest, page: i + 2, limit: pageSize })
    )
  );

  const data = [first, ...remaining].flatMap((r) => r?.data || []);
  return {
    ...first,
    data,
    pagination: {
      ...(first.pagination || {}),
      page: 1,
      limit: data.length,
      total: data.length,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
    },
  };
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
