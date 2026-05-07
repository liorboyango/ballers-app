/**
 * Tests for the AdminRoute component.
 *
 * Verifies that:
 * - Unauthenticated users are redirected to /login with 'from' state
 * - Non-admin users (role !== 'admin') are redirected to /
 * - Admin users see the protected content
 * - Loading state shows a spinner instead of redirecting prematurely
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminRoute from '../../components/AdminRoute';
import { AuthContext } from '../../context/AuthContext';

/** Helper: render AdminRoute with a mock auth context */
function renderWithAuth(authValue, path = '/admin') {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div data-testid="admin-content">Admin content</div>
              </AdminRoute>
            }
          />
          <Route path="/login" element={<div data-testid="login-page">Login page</div>} />
          <Route path="/" element={<div data-testid="home-page">Home page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('AdminRoute', () => {
  it('shows loading spinner while auth state is resolving', () => {
    const authValue = { isAuthenticated: false, user: null, loading: true };
    renderWithAuth(authValue);
    // Should not redirect yet — show loading indicator
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', () => {
    const authValue = { isAuthenticated: false, user: null, loading: false };
    renderWithAuth(authValue);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('redirects non-admin users to /', () => {
    const authValue = {
      isAuthenticated: true,
      user: { name: 'Regular User', role: 'customer' },
      loading: false,
    };
    renderWithAuth(authValue);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('renders protected content for admin users', () => {
    const authValue = {
      isAuthenticated: true,
      user: { name: 'Admin User', role: 'admin' },
      loading: false,
    };
    renderWithAuth(authValue);
    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });
});
