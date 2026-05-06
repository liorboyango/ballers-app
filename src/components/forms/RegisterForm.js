/**
 * RegisterForm component.
 * Uses React Hook Form + Zod for validation.
 * On success, stores JWT token and updates AuthContext.
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { registerSchema } from '../../utils/validation';
import { FormInput } from './FormField';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

/**
 * @param {object} props
 * @param {function} [props.onSuccess] - Callback after successful registration
 * @param {function} [props.onSwitchToLogin] - Switch to login tab
 */
export default function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      const { token, user } = response.data;
      login(token, user);

      if (onSuccess) {
        onSuccess(user);
      } else {
        navigate('/');
      }
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && Array.isArray(apiErrors)) {
        setServerError(apiErrors.map((e) => e.message).join('. '));
      } else {
        setServerError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            'Registration failed. Please try again.'
        );
      }
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { level: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 3) return { level: 3, label: 'Good', color: 'bg-blue-500' };
    return { level: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(passwordValue);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Registration form"
      className="flex flex-col gap-5"
    >
      {/* Server-level error */}
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm"
        >
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {serverError}
        </div>
      )}

      {/* Full Name */}
      <FormInput
        label="Full name"
        id="register-name"
        type="text"
        placeholder="John Doe"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />

      {/* Email */}
      <FormInput
        label="Email address"
        id="register-email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Password */}
      <div className="flex flex-col gap-1">
        <label htmlFor="register-password" className="text-sm font-medium text-white">
          Password
        </label>
        <div className="relative">
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 6 characters"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby="register-password-strength register-password-error"
            className={`w-full px-4 py-3 pr-12 rounded-lg bg-[#1A1A2E] border text-white placeholder-[#A8B2C1] text-sm transition-colors focus:outline-none focus:ring-1 ${
              errors.password
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                : 'border-[#2A3550] focus:border-[#E8C547] focus:ring-[#E8C547]/30'
            }`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8B2C1] hover:text-white transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Password strength bar */}
        {passwordValue && (
          <div id="register-password-strength" className="flex items-center gap-2 mt-1">
            <div className="flex gap-1 flex-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= strength.level ? strength.color : 'bg-[#2A3550]'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[#A8B2C1]">{strength.label}</span>
          </div>
        )}

        {errors.password && (
          <p id="register-password-error" role="alert" className="text-xs text-red-400 flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1">
        <label htmlFor="register-confirm" className="text-sm font-medium text-white">
          Confirm password
        </label>
        <div className="relative">
          <input
            id="register-confirm"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'register-confirm-error' : undefined}
            className={`w-full px-4 py-3 pr-12 rounded-lg bg-[#1A1A2E] border text-white placeholder-[#A8B2C1] text-sm transition-colors focus:outline-none focus:ring-1 ${
              errors.confirmPassword
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                : 'border-[#2A3550] focus:border-[#E8C547] focus:ring-[#E8C547]/30'
            }`}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8B2C1] hover:text-white transition-colors"
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirm ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="register-confirm-error" role="alert" className="text-xs text-red-400 flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-6 bg-[#E8C547] text-[#1A1A2E] font-bold uppercase tracking-wider rounded-lg hover:bg-[#D4A800] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </button>

      {/* Switch to login */}
      {onSwitchToLogin && (
        <p className="text-center text-sm text-[#A8B2C1]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#E8C547] hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      )}
    </form>
  );
}
