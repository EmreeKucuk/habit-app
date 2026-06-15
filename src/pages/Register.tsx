import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RegisterRequest } from '../types';
import { API_BASE_URL } from '../services/api';

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

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

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      await register(formData);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FEFAE0] dark:bg-gray-900 p-4 font-sans">
        <div className="w-full max-w-md bg-[#FEFAE0] dark:bg-gray-900 p-8 md:p-10 rounded-[32px] shadow-[0_8px_30px_rgb(52,78,65,0.05)] border border-[#344E41] dark:border-gray-700/5 text-center">
          <CheckCircle className="h-16 w-16 text-[#A3B18A] mx-auto mb-6" />
          <h2 className="text-2xl font-black text-[#344E41] dark:text-gray-100 mb-2 tracking-tight">
            Check your email
          </h2>
          <p className="text-[#344E41] dark:text-gray-100 opacity-70 font-medium mb-8">
            We've sent a verification link to your email address. Please click the link to verify your account.
          </p>
          <Link
            to="/login"
            className="w-full bg-[#344E41] dark:bg-gray-700 hover:bg-[#2a3f35] text-[#FEFAE0] dark:text-gray-300 font-bold py-4 rounded-xl transition-colors shadow-lg flex justify-center items-center inline-flex"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEFAE0] dark:bg-gray-900 p-4 font-sans">
      <div className="w-full max-w-md bg-[#FEFAE0] dark:bg-gray-900 p-8 md:p-10 rounded-[32px] shadow-[0_8px_30px_rgb(52,78,65,0.05)] border border-[#344E41] dark:border-gray-700/5">

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-[#A3B18A] dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <span className="text-[#FEFAE0] dark:text-gray-300 font-black text-3xl">H</span>
          </div>
          <h1 className="text-3xl font-black text-[#344E41] dark:text-gray-100 tracking-tight">Create Account</h1>
          <p className="text-[#344E41] dark:text-gray-100 opacity-60 font-medium mt-1">Join the Sprout community.</p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-8">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#344E41] dark:text-gray-100 border border-gray-200 px-4 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            className="w-full flex items-center justify-center gap-3 bg-black text-white px-4 py-3.5 rounded-xl font-bold hover:bg-gray-900 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.365 1.44c0 0-1.424.088-3.056 1.708-1.574 1.564-1.472 3.256-1.472 3.256s1.656-.05 3.096-1.554c1.556-1.63 1.432-3.41 1.432-3.41zm-1.8 5.612c-2.422-.164-3.516 1.258-4.8 1.258-1.252 0-2.656-1.242-4.48-1.242-2.316 0-4.636 1.442-5.752 3.654-2.128 4.214-.54 10.428 1.832 13.916 1.236 1.814 2.76 3.444 4.8 3.382 2.008-.06 2.456-1.122 4.604-1.122 2.18 0 2.652 1.122 4.684 1.122 2.052 0 3.396-1.58 4.652-3.356 1.464-2.072 2.064-4.082 2.096-4.184-.044-.016-3.924-1.458-3.968-5.858-.04-3.67 3.036-5.412 3.164-5.496-1.748-2.52-4.488-2.85-5.332-2.932z" />
            </svg>
            Sign up with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center mb-8">
          <div className="flex-1 h-px bg-[#344E41] dark:bg-gray-700 opacity-10"></div>
          <span className="px-4 text-xs font-bold text-[#344E41] dark:text-gray-100 opacity-40 uppercase tracking-widest">Or</span>
          <div className="flex-1 h-px bg-[#344E41] dark:bg-gray-700 opacity-10"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl font-medium text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-xs font-bold text-[#344E41] dark:text-gray-100 uppercase tracking-wider ml-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#344E41] dark:text-gray-100 opacity-40" />
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full bg-[#A3B18A] dark:bg-gray-800/10 text-[#344E41] dark:text-gray-100 px-4 py-3.5 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9C46A] transition-all font-medium placeholder-[#344E41]/30"
                placeholder="Choose a username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-bold text-[#344E41] dark:text-gray-100 uppercase tracking-wider ml-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#344E41] dark:text-gray-100 opacity-40" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-[#A3B18A] dark:bg-gray-800/10 text-[#344E41] dark:text-gray-100 px-4 py-3.5 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9C46A] transition-all font-medium placeholder-[#344E41]/30"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-bold text-[#344E41] dark:text-gray-100 uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#344E41] dark:text-gray-100 opacity-40" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-[#A3B18A] dark:bg-gray-800/10 text-[#344E41] dark:text-gray-100 px-4 py-3.5 pl-12 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9C46A] transition-all font-medium placeholder-[#344E41]/30"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#344E41] dark:text-gray-100 opacity-40 hover:opacity-100 transition-opacity"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#344E41] dark:text-gray-100 uppercase tracking-wider ml-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#344E41] dark:text-gray-100 opacity-40" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full bg-[#A3B18A] dark:bg-gray-800/10 text-[#344E41] dark:text-gray-100 px-4 py-3.5 pl-12 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9C46A] transition-all font-medium placeholder-[#344E41]/30"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#344E41] dark:text-gray-100 opacity-40 hover:opacity-100 transition-opacity"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center pt-2">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-[#A3B18A] focus:ring-[#E9C46A] border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm font-semibold text-[#344E41] dark:text-gray-100 opacity-80">
              I agree to the{' '}
              <Link to="/terms" className="text-[#A3B18A] hover:text-[#344E41] dark:text-gray-100 transition-colors">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-[#A3B18A] hover:text-[#344E41] dark:text-gray-100 transition-colors">
                Privacy Policy
              </Link>
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#344E41] dark:bg-gray-700 hover:bg-[#2a3f35] text-[#FEFAE0] dark:text-gray-300 font-bold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-50 flex justify-center items-center"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-[#FEFAE0]/30 border-t-[#FEFAE0] rounded-full animate-spin"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[#344E41] dark:text-gray-100 font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-[#A3B18A] hover:text-[#344E41] dark:text-gray-100 font-bold transition-colors ml-1"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
