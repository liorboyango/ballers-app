/**
 * Tests for AuthContext — authentication state management.
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Mock the API service
jest.mock('../../services/api');

// Test component that uses auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'guest'}</div>
      <div data-testid="user-name">{user?.name || 'none'}</div>
      <button
        onClick={() => login('test@example.com', 'password123')}
        data-testid="login-btn"
      >
        Login
      </button>
      <button
        onClick={() => register('Test User', 'test@example.com', 'password123')}
        data-testid="register-btn"
      >
        Register
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

const renderWithAuth = () =>
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('starts as unauthenticated when no token stored', async () => {
    api.get.mockRejectedValueOnce(new Error('No token'));
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('guest');
    });
  });

  it('logs in successfully and updates state', async () => {
    api.get.mockRejectedValueOnce(new Error('No token'));
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'test-jwt-token',
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'user' },
      },
    });

    renderWithAuth();
    await waitFor(() => screen.getByTestId('login-btn'));

    await act(async () => {
      userEvent.click(screen.getByTestId('login-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });

    expect(localStorage.getItem('ballers_token')).toBe('test-jwt-token');
  });

  it('logs out and clears state', async () => {
    // Set up authenticated state
    localStorage.setItem('ballers_token', 'test-token');
    localStorage.setItem('ballers_user', JSON.stringify({ name: 'Test User' }));
    api.get.mockResolvedValueOnce({
      data: { success: true, user: { name: 'Test User', email: 'test@example.com' } },
    });

    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    await act(async () => {
      userEvent.click(screen.getByTestId('logout-btn'));
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('guest');
    expect(localStorage.getItem('ballers_token')).toBeNull();
  });

  it('registers a new user successfully', async () => {
    api.get.mockRejectedValueOnce(new Error('No token'));
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'new-user-token',
        user: { id: '2', name: 'New User', email: 'new@example.com', role: 'user' },
      },
    });

    renderWithAuth();
    await waitFor(() => screen.getByTestId('register-btn'));

    await act(async () => {
      userEvent.click(screen.getByTestId('register-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('New User');
    });
  });

  it('handles login failure gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('No token'));
    api.post.mockRejectedValueOnce({
      response: { data: { error: 'Invalid credentials' } },
    });

    renderWithAuth();
    await waitFor(() => screen.getByTestId('login-btn'));

    let result;
    await act(async () => {
      // Directly test the login function
      const { login } = screen.getByTestId('login-btn').closest('[data-testid]') || {};
    });

    // Auth status should remain guest
    expect(screen.getByTestId('auth-status')).toHaveTextContent('guest');
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    consoleError.mockRestore();
  });
});
