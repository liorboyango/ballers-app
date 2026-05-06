/**
 * Unit tests for RegisterForm component.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterForm from '../RegisterForm';

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ login: jest.fn() }),
}));

jest.mock('../../../services/api', () => ({
  post: jest.fn(),
}));

const api = require('../../../services/api');

const renderRegisterForm = (props = {}) =>
  render(
    <MemoryRouter>
      <RegisterForm {...props} />
    </MemoryRouter>
  );

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all required fields', () => {
    renderRegisterForm();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows error when name is too short', async () => {
    renderRegisterForm();
    await userEvent.type(screen.getByLabelText(/full name/i), 'A');
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    renderRegisterForm();
    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'different123');
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('calls api.post on valid submission', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'tok', user: { id: '1', name: 'John Doe', email: 'john@example.com' } },
    });
    const onSuccess = jest.fn();
    renderRegisterForm({ onSuccess });

    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
    });
  });

  it('shows server error on failed registration', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { error: 'Email already in use' } },
    });
    renderRegisterForm();

    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email address/i), 'existing@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already in use/i)).toBeInTheDocument();
    });
  });
});
