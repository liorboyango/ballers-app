/**
 * Tests for the Teams API service
 */
import apiClient from '../../services/api';
import { getTeams, getTeamById } from '../../services/teamsApi';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
  API_BASE_URL: 'http://localhost:5000/api',
}));

describe('teamsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTeams', () => {
    it('calls GET /teams with no params by default', async () => {
      const mockData = { success: true, data: [], pagination: {} };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await getTeams();

      expect(apiClient.get).toHaveBeenCalledWith('/teams', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('passes query params to the API', async () => {
      const mockData = { success: true, data: [], pagination: {} };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      await getTeams({ group: 'A', search: 'Brazil', page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith('/teams', {
        params: { group: 'A', search: 'Brazil', page: 1 },
      });
    });

    it('throws error when API call fails', async () => {
      const error = { status: 500, message: 'Server error' };
      apiClient.get.mockRejectedValueOnce(error);

      await expect(getTeams()).rejects.toEqual(error);
    });
  });

  describe('getTeamById', () => {
    it('calls GET /teams/:id', async () => {
      const mockData = { success: true, data: { _id: '123', name: 'Brazil' } };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await getTeamById('123');

      expect(apiClient.get).toHaveBeenCalledWith('/teams/123');
      expect(result).toEqual(mockData);
    });
  });
});
