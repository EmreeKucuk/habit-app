import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginRequest } from '../types';
import { API_BASE_URL } from '../services/api';

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginRequest>({
    emailOrUsername: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleOAuth = (provider: 'google' | 'apple') => {
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
    if (provider === 'google') {
      window.location.href = `${API_BASE_URL}/auth/google-signin?redirect=${redirectUri}`;
    } else {
      alert('Apple Sign-In is only available on iOS devices or requires a different web configuration.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEFAE0] p-4 font-sans">
      <div className="w-full max-w-md bg-[#FEFAE0] p-8 md:p-10 rounded-[32px] shadow-[0_8px_30px_rgb(52,78,65,0.05)] border border-[#344E41]/5">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-[#A3B18A] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <span className="text-[#FEFAE0] font-black text-3xl">H</span>
          </div>
          <h1 className="text-3xl font-black text-[#344E41] tracking-tight">HabitForge</h1>
          <p className="text-[#344E41] opacity-60 font-medium mt-1">Welcome back, let's get tracking.</p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-8">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#344E41] border border-gray-200 px-4 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
          
          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            className="w-full flex items-center justify-center gap-3 bg-black text-white px-4 py-3.5 rounded-xl font-bold hover:bg-gray-900 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.365 1.44c0 0-1.424.088-3.056 1.708-1.574 1.564-1.472 3.256-1.472 3.256s1.656-.05 3.096-1.554c1.556-1.63 1.432-3.41 1.432-3.41zm-1.8 5.612c-2.422-.164-3.516 1.258-4.8 1.258-1.252 0-2.656-1.242-4.48-1.242-2.316 0-4.636 1.442-5.752 3.654-2.128 4.214-.54 10.428 1.832 13.916 1.236 1.814 2.76 3.444 4.8 3.382 2.008-.06 2.456-1.122 4.604-1.122 2.18 0 2.652 1.122 4.684 1.122 2.052 0 3.396-1.58 4.652-3.356 1.464-2.072 2.064-4.082 2.096-4.184-.044-.016-3.924-1.458-3.968-5.858-.04-3.67 3.036-5.412 3.164-5.496-1.748-2.52-4.488-2.85-5.332-2.932z" />
            </svg>
            Continue with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center mb-8">
          <div className="flex-1 h-px bg-[#344E41] opacity-10"></div>
          <span className="px-4 text-xs font-bold text-[#344E41] opacity-40 uppercase tracking-widest">Or</span>
          <div className="flex-1 h-px bg-[#344E41] opacity-10"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl font-medium text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="emailOrUsername" className="block text-xs font-bold text-[#344E41] uppercase tracking-wider ml-1">
              Email or Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#344E41] opacity-40" />
              <input
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                value={formData.emailOrUsername}
                onChange={handleChange}
                required
                className="w-full bg-[#A3B18A]/10 text-[#344E41] px-4 py-3.5 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9C46A] transition-all font-medium placeholder-[#344E41]/30"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-bold text-[#344E41] uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#344E41] opacity-40" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-[#A3B18A]/10 text-[#344E41] px-4 py-3.5 pl-12 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9C46A] transition-all font-medium placeholder-[#344E41]/30"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#344E41] opacity-40 hover:opacity-100 transition-opacity"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#A3B18A] focus:ring-[#E9C46A] border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm font-semibold text-[#344E41] opacity-80">
                Remember me
              </label>
            </div>

            <Link
              to="/forgot-password"
              className="text-sm font-bold text-[#A3B18A] hover:text-[#344E41] transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#344E41] hover:bg-[#2a3f35] text-[#FEFAE0] font-bold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-50 flex justify-center items-center"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-[#FEFAE0]/30 border-t-[#FEFAE0] rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[#344E41] font-medium">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-[#A3B18A] hover:text-[#344E41] font-bold transition-colors ml-1"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
