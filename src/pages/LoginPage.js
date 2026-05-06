/**
 * Login Page
 * Authentication form with email/password login.
 * Redirects to home on success.
 */
import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { loginSchema } from '../utils/validation';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear error on unmount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    await login(data.email, data.password);
  };

  return (
    <div
      className="page-enter min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="font-bebas text-5xl text-gold tracking-wider hover:text-gold-hover transition-colors"
          >
            BALLERS
          </Link>
          <p className="text-ballers-muted text-sm mt-2">Wear the Game</p>
        </div>

        {/* Card */}
        <div className="bg-navy-surface border border-ballers-border rounded-2xl p-8">
          <h1 className="font-bebas text-3xl text-white tracking-wider mb-2">WELCOME BACK</h1>
          <p className="text-ballers-muted text-sm mb-8">Sign in to your account</p>

          {/* Error message */}
          {error && (
            <div
              className="bg-ballers-red/10 border border-ballers-red/30 rounded-lg p-3 mb-6"
              role="alert"
            >
              <p className="text-ballers-red text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ballers-muted mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                {...register('email')}
                type="email"
                placeholder="your@email.com"
                className="input-field"
                autoComplete="email"
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-ballers-red text-xs mt-1" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ballers-muted mb-1.5">
                Password
              </label>
              <input
                id="password"
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="input-field"
                autoComplete="current-password"
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-ballers-red text-xs mt-1" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'LOGIN'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 border-t border-ballers-border" />
            <span className="text-ballers-muted text-xs uppercase tracking-widest">or</span>
            <div className="flex-1 border-t border-ballers-border" />
          </div>

          {/* Register link */}
          <p className="text-center text-ballers-muted text-sm">
            New here?{' '}
            <Link
              to="/register"
              className="text-gold hover:text-gold-hover font-medium transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>

        {/* Back to shop */}
        <p className="text-center mt-6">
          <Link
            to="/products"
            className="text-ballers-muted text-sm hover:text-gold transition-colors"
          >
            Continue as guest →
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
