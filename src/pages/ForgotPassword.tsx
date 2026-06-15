import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authApi.forgotPassword({ email });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email');
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
            If an account with that email exists, we've sent a password reset link.
          </p>
          <Link
            to="/login"
            className="w-full bg-[#344E41] dark:bg-gray-700 hover:bg-[#2a3f35] text-[#FEFAE0] dark:text-gray-300 font-bold py-4 rounded-xl transition-colors shadow-lg flex justify-center items-center inline-flex"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEFAE0] dark:bg-gray-900 p-4 font-sans">
      <div className="w-full max-w-md bg-[#FEFAE0] dark:bg-gray-900 p-8 md:p-10 rounded-[32px] shadow-[0_8px_30px_rgb(52,78,65,0.05)] border border-[#344E41] dark:border-gray-700/5">
        <Link to="/login" className="inline-flex items-center text-[#A3B18A] hover:text-[#344E41] dark:text-gray-100 mb-8 font-bold transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to login
        </Link>
        
        <h2 className="text-3xl font-black text-[#344E41] dark:text-gray-100 mb-3 tracking-tight">
          Forgot password?
        </h2>
        <p className="text-[#344E41] dark:text-gray-100 opacity-60 font-medium mb-8">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl font-medium text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-bold text-[#344E41] dark:text-gray-100 uppercase tracking-wider ml-1">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#344E41] dark:text-gray-100 opacity-40" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#A3B18A] dark:bg-gray-800/10 text-[#344E41] dark:text-gray-100 px-4 py-3.5 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9C46A] transition-all font-medium placeholder-[#344E41]/30"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#344E41] dark:bg-gray-700 hover:bg-[#2a3f35] text-[#FEFAE0] dark:text-gray-300 font-bold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-50 flex justify-center items-center"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-[#FEFAE0]/30 border-t-[#FEFAE0] rounded-full animate-spin"></div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
