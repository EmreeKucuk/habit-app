import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { setAuthData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');
        const refreshToken = queryParams.get('refreshToken');
        const errorParam = queryParams.get('error');

        if (errorParam) {
          setError(errorParam);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!token) {
          setError('Authentication failed: No token received.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Temporarily store token to make the /auth/me request
        localStorage.setItem('token', token);

        // Fetch user data
        const response = await authApi.me();

        if (response && response.user) {
          // Update context and store completely
          setAuthData(token, refreshToken || '', response.user);
          navigate('/dashboard', { replace: true });
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError('An error occurred during authentication.');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuth();
  }, [location, navigate, setAuthData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEFAE0] dark:bg-gray-900 p-4 font-sans">
      <div className="text-center">
        {error ? (
          <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl font-bold">
            {error}
            <p className="text-sm font-medium mt-2">Redirecting to login...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <LoadingSpinner size="large" />
            <p className="text-[#344E41] dark:text-gray-100 font-bold mt-4 tracking-wide">
              Completing authentication...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
