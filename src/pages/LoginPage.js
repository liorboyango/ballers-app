/**
 * LoginPage - Combined Login / Register page.
 * Displays a tab switcher between LoginForm and RegisterForm.
 * Styled with the Ballers dark navy theme.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/forms/LoginForm';
import RegisterForm from '../components/forms/RegisterForm';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Allow deep-linking to register tab via ?tab=register
  const params = new URLSearchParams(location.search);
  const initialTab = params.get('tab') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  const handleSuccess = () => {
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)',
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-block"
            aria-label="Ballers - go to home page"
          >
            <span
              className="text-5xl font-black tracking-widest"
              style={{ fontFamily: "'Bebas Neue', sans-serif", color: '#E8C547' }}
            >
              BALLERS
            </span>
          </Link>
          <p className="text-[#A8B2C1] text-sm mt-2 tracking-wide uppercase">
            Wear the Game
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#16213E] border border-[#2A3550] rounded-2xl p-8 shadow-2xl">
          {/* Tab switcher */}
          <div
            className="flex rounded-lg overflow-hidden border border-[#2A3550] mb-8"
            role="tablist"
            aria-label="Authentication options"
          >
            <button
              role="tab"
              aria-selected={activeTab === 'login'}
              aria-controls="tab-panel-login"
              id="tab-login"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === 'login'
                  ? 'bg-[#E8C547] text-[#1A1A2E]'
                  : 'text-[#A8B2C1] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'register'}
              aria-controls="tab-panel-register"
              id="tab-register"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === 'register'
                  ? 'bg-[#E8C547] text-[#1A1A2E]'
                  : 'text-[#A8B2C1] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Tab panels */}
          <div
            id="tab-panel-login"
            role="tabpanel"
            aria-labelledby="tab-login"
            hidden={activeTab !== 'login'}
          >
            {activeTab === 'login' && (
              <>
                <h1 className="text-2xl font-bold text-white mb-6">
                  Welcome Back
                </h1>
                <LoginForm
                  onSuccess={handleSuccess}
                  onSwitchToRegister={() => setActiveTab('register')}
                />
              </>
            )}
          </div>

          <div
            id="tab-panel-register"
            role="tabpanel"
            aria-labelledby="tab-register"
            hidden={activeTab !== 'register'}
          >
            {activeTab === 'register' && (
              <>
                <h1 className="text-2xl font-bold text-white mb-6">
                  Create Your Account
                </h1>
                <RegisterForm
                  onSuccess={handleSuccess}
                  onSwitchToLogin={() => setActiveTab('login')}
                />
              </>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#A8B2C1] mt-6">
          By continuing, you agree to our{' '}
          <span className="text-[#E8C547] cursor-pointer hover:underline">Terms of Service</span>
          {' '}and{' '}
          <span className="text-[#E8C547] cursor-pointer hover:underline">Privacy Policy</span>.
        </p>
      </div>
    </main>
  );
}
