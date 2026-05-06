/**
 * Tests for the Axios API client configuration
 */
import axios from 'axios';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('creates axios instance with correct base URL', () => {
    // Re-import to trigger module initialization
    jest.resetModules();
    process.env.REACT_APP_API_URL = 'http://test-api.com/api';
    require('../../services/api');
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'http://test-api.com/api',
        timeout: 15000,
      })
    );
  });

  it('uses default base URL when env var not set', () => {
    jest.resetModules();
    delete process.env.REACT_APP_API_URL;
    require('../../services/api');
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'http://localhost:5000/api',
      })
    );
  });

  it('sets up request and response interceptors', () => {
    jest.resetModules();
    const apiModule = require('../../services/api');
    const client = apiModule.default;
    expect(client.interceptors.request.use).toHaveBeenCalled();
    expect(client.interceptors.response.use).toHaveBeenCalled();
  });
});
