/**
 * Register Page
 * New user registration form with validation.
 * Redirects to home on success.
 */
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { registerSchema } from '../utils/validation';

function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated, isLoading, error, clearError } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear error on unmount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
    });
  };

  return (
    <div
      className="page-enter min-h-screen flex items-center justify-center px-4 py-12"
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
          <h1 className="font-bebas text-3xl text-white tracking-wider mb-2">CREATE ACCOUNT</h1>
          <p className="text-ballers-muted text-sm mb-8">Join the Ballers community</p>

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
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-ballers-muted mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                {...register('name')}
                type="text"
                placeholder="John Doe"
                className="input-field"
                autoComplete="name"
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-ballers-red text-xs mt-1" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

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
                placeholder="Min. 8 characters"
                className="input-field"
                autoComplete="new-password"
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-ballers-red text-xs mt-1" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-ballers-muted mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                {...register('confirmPassword')}
                type="password"
                placeholder="Repeat your password"
                className="input-field"
                autoComplete="new-password"
                aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
              />
              {errors.confirmPassword && (
                <p id="confirm-error" className="text-ballers-red text-xs mt-1" role="alert">
                  {errors.confirmPassword.message}
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
                  Creating account...
                </span>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 border-t border-ballers-border" />
            <span className="text-ballers-muted text-xs uppercase tracking-widest">or</span>
            <div className="flex-1 border-t border-ballers-border" />
          </div>

          {/* Login link */}
          <p className="text-center text-ballers-muted text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-gold hover:text-gold-hover font-medium transition-colors"
            >
              Sign In
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

export default RegisterPage;
