import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVerified, setLastVerified] = useState<number>(0);

  const VERIFICATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      const savedLastVerified = localStorage.getItem('lastVerified');

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          const lastVerifiedTime = savedLastVerified ? parseInt(savedLastVerified) : 0;
          const now = Date.now();
          
          // Only verify if more than 5 minutes have passed since last verification
          if (now - lastVerifiedTime > VERIFICATION_INTERVAL) {
            // Verify token with backend with a shorter timeout for initial load
            const response = await authApi.me();
            setUser(response.user);
            setLastVerified(now);
            localStorage.setItem('lastVerified', now.toString());
          } else {
            // Use cached user data
            setLastVerified(lastVerifiedTime);
          }
        } catch (error: any) {
          console.error('Token verification failed:', error);
          
          // If it's a timeout or network error, keep the user logged in locally
          // but try to refresh in the background
          if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
            console.log('Network timeout, keeping user logged in locally');
            // Don't clear the token immediately, just set loading to false
          } else {
            // Only clear auth on actual auth errors (401, 403)
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('lastVerified');
            setToken(null);
            setUser(null);
            setLastVerified(0);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response: AuthResponse = await authApi.login(credentials);
      
      setUser(response.user);
      setToken(response.token);
      const now = Date.now();
      setLastVerified(now);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('lastVerified', now.toString());
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      await authApi.register(data);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setLastVerified(0);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('lastVerified');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
