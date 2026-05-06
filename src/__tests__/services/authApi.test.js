/**
 * Tests for the Auth API service
 */
import apiClient from '../../services/api';
import { login, register, getMe } from '../../services/authApi';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
  API_BASE_URL: 'http://localhost:5000/api',
}));

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('calls POST /auth/login with credentials', async () => {
      const mockResponse = {
        success: true,
        token: 'jwt-token',
        user: { id: '1', name: 'John', email: 'john@test.com' },
      };
      apiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await login({ email: 'john@test.com', password: 'password123' });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'john@test.com',
        password: 'password123',
      });
      expect(result).toEqual(mockResponse);
    });

    it('throws error on invalid credentials', async () => {
      const error = { status: 401, message: 'Invalid credentials' };
      apiClient.post.mockRejectedValueOnce(error);

      await expect(login({ email: 'bad@test.com', password: 'wrong' })).rejects.toEqual(error);
    });
  });

  describe('register', () => {
    it('calls POST /auth/register with user data', async () => {
      const mockResponse = {
        success: true,
        token: 'jwt-token',
        user: { id: '1', name: 'John', email: 'john@test.com' },
      };
      apiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await register({ name: 'John', email: 'john@test.com', password: 'password123' });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'John',
        email: 'john@test.com',
        password: 'password123',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMe', () => {
    it('calls GET /auth/me', async () => {
      const mockResponse = { success: true, user: { id: '1', name: 'John' } };
      apiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await getMe();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse);
    });
  });
});
