/**
 * Unit tests for LoginForm component.
 * Tests validation behavior and form submission.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from '../LoginForm';

// Mock dependencies
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ login: jest.fn() }),
}));

jest.mock('../../../services/api', () => ({
  post: jest.fn(),
}));

const api = require('../../../services/api');

const renderLoginForm = (props = {}) =>
  render(
    <MemoryRouter>
      <LoginForm {...props} />
    </MemoryRouter>
  );

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email and password fields', () => {
    renderLoginForm();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders the login button', () => {
    renderLoginForm();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    renderLoginForm();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    renderLoginForm();
    await userEvent.type(screen.getByLabelText(/email address/i), 'notanemail');
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    renderLoginForm();
    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), '123');
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('calls api.post with correct data on valid submission', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'test-token', user: { id: '1', name: 'Test', email: 'test@example.com' } },
    });
    const onSuccess = jest.fn();
    renderLoginForm({ onSuccess });

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows server error on failed login', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { error: 'Invalid credentials' } },
    });
    renderLoginForm();

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('calls onSwitchToRegister when link is clicked', () => {
    const onSwitch = jest.fn();
    renderLoginForm({ onSwitchToRegister: onSwitch });
    fireEvent.click(screen.getByText(/create account/i));
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it('toggles password visibility', async () => {
    renderLoginForm();
    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByLabelText(/show password/i));
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByLabelText(/hide password/i));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
