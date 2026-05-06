/**
 * LoginPage
 * Login and Register forms with validation.
 * Calls POST /api/auth/login and POST /api/auth/register.
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuth from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui';
import { useToast } from '../context/ToastContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const AuthInput = React.forwardRef(({ label, error, type = 'text', ...props }, ref) => (
  <div>
    <label className="block text-ballers-muted text-sm mb-1.5">{label}</label>
    <input
      ref={ref}
      type={type}
      {...props}
      className={`w-full px-4 py-3 bg-navy border rounded-lg text-white placeholder-ballers-muted focus:outline-none focus:ring-1 transition-colors ${
        error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-ballers-border focus:border-gold focus:ring-gold/30'
      }`}
    />
    {error && <p className="text-red-400 text-xs mt-1">{error.message}</p>}
  </div>
));
AuthInput.displayName = 'AuthInput';

const LoginPage = () => {
  const [mode, setMode] = useState('login');
  const { login, register: registerUser, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const from = location.state?.from || '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const loginForm = useForm({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm({ resolver: zodResolver(registerSchema) });

  const handleLogin = async (data) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegister = async (data) => {
    try {
      await registerUser(data.name, data.email, data.password);
      toast.success('Account created! Welcome to Ballers!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-bebas text-5xl text-gold tracking-wide">BALLERS</Link>
          <p className="text-ballers-muted text-sm mt-1">Wear the Game</p>
        </div>
        <div className="bg-navy-surface border border-ballers-border rounded-2xl p-8">
          <div className="flex mb-8 bg-navy rounded-lg p-1">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                  mode === m ? 'bg-gold text-navy' : 'text-ballers-muted hover:text-white'
                }`}
                aria-selected={mode === m}
              >
                {m === 'login' ? 'Login' : 'Create Account'}
              </button>
            ))}
          </div>

          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} noValidate>
              <div className="space-y-4 mb-6">
                <h2 className="font-bebas text-3xl text-white tracking-wide">Welcome Back</h2>
                <AuthInput label="Email" type="email" placeholder="you@example.com" error={loginForm.formState.errors.email} autoComplete="email" {...loginForm.register('email')} />
                <AuthInput label="Password" type="password" placeholder="Password" error={loginForm.formState.errors.password} autoComplete="current-password" {...loginForm.register('password')} />
              </div>
              <button
                type="submit"
                disabled={loading || loginForm.formState.isSubmitting}
                className="w-full py-4 bg-gold text-navy font-bold uppercase tracking-wider rounded-lg hover:bg-gold-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(loading || loginForm.formState.isSubmitting) ? <><LoadingSpinner size="sm" /> Logging in...</> : 'Login'}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} noValidate>
              <div className="space-y-4 mb-6">
                <h2 className="font-bebas text-3xl text-white tracking-wide">Create Account</h2>
                <AuthInput label="Full Name" placeholder="John Doe" error={registerForm.formState.errors.name} autoComplete="name" {...registerForm.register('name')} />
                <AuthInput label="Email" type="email" placeholder="you@example.com" error={registerForm.formState.errors.email} autoComplete="email" {...registerForm.register('email')} />
                <AuthInput label="Password" type="password" placeholder="Password" error={registerForm.formState.errors.password} autoComplete="new-password" {...registerForm.register('password')} />
                <AuthInput label="Confirm Password" type="password" placeholder="Confirm Password" error={registerForm.formState.errors.confirmPassword} autoComplete="new-password" {...registerForm.register('confirmPassword')} />
              </div>
              <button
                type="submit"
                disabled={loading || registerForm.formState.isSubmitting}
                className="w-full py-4 bg-gold text-navy font-bold uppercase tracking-wider rounded-lg hover:bg-gold-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(loading || registerForm.formState.isSubmitting) ? <><LoadingSpinner size="sm" /> Creating account...</> : 'Create Account'}
              </button>
            </form>
          )}

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-ballers-border" />
            <span className="text-ballers-muted text-xs">or continue with</span>
            <div className="flex-1 h-px bg-ballers-border" />
          </div>
          <p className="text-center text-ballers-muted text-sm">
            {mode === 'login' ? (
              <>New here? <button onClick={() => setMode('register')} className="text-gold hover:text-gold-hover transition-colors font-semibold">Create Account</button></>
            ) : (
              <>Already have an account? <button onClick={() => setMode('login')} className="text-gold hover:text-gold-hover transition-colors font-semibold">Login</button></>
            )}
          </p>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
