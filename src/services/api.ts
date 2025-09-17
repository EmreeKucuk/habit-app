import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Habit, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  HabitStats 
} from '../types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || '/api'
  : 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 5000, // Reduced timeout for faster feedback
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await this.client.post('/auth/refresh', {
                refreshToken,
              });

              const { token, refreshToken: newRefreshToken } = response.data;
              localStorage.setItem('token', token);
              localStorage.setItem('refreshToken', newRefreshToken);

              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            } catch (refreshError) {
              // Refresh failed, logout user
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  auth = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
      const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/login', credentials);
      return response.data;
    },

    register: async (data: RegisterRequest): Promise<{ message: string; userId: string }> => {
      const response = await this.client.post('/auth/register', data);
      return response.data;
    },

    forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
      const response = await this.client.post('/auth/forgot-password', data);
      return response.data;
    },

    resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
      const response = await this.client.post('/auth/reset-password', data);
      return response.data;
    },

    verifyEmail: async (token: string): Promise<{ message: string }> => {
      const response = await this.client.post('/auth/verify-email', { token });
      return response.data;
    },

    me: async (): Promise<{ user: User }> => {
      const response = await this.client.get('/auth/me');
      return response.data;
    },

    refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
      const response = await this.client.post('/auth/refresh', { refreshToken });
      return response.data;
    },
  };

  // Habits endpoints
  habits = {
    getAll: async (params?: { category?: string; sort?: string; order?: string }): Promise<{ habits: Habit[] }> => {
      const response = await this.client.get('/habits', { params });
      return response.data;
    },

    create: async (habit: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'completedDates' | 'streak' | 'comments'>): Promise<{ habit: Habit; message: string }> => {
      const response = await this.client.post('/habits', habit);
      return response.data;
    },

    complete: async (habitId: string, data?: { date?: string; notes?: string; mood?: string; value?: number }): Promise<{ message: string; completed: boolean; xpGained?: number }> => {
      const response = await this.client.post(`/habits/${habitId}/complete`, data);
      return response.data;
    },

    delete: async (habitId: string): Promise<{ message: string }> => {
      const response = await this.client.delete(`/habits/${habitId}`);
      return response.data;
    },

    getStats: async (period?: string): Promise<HabitStats> => {
      const response = await this.client.get('/habits/stats', { params: { period } });
      return response.data;
    },
  };

  // Users endpoints
  users = {
    getProfile: async (userId: string): Promise<{ user: User }> => {
      const response = await this.client.get(`/users/${userId}`);
      return response.data;
    },

    updateProfile: async (data: Partial<User>): Promise<{ user: User; message: string }> => {
      const response = await this.client.put('/users/profile', data);
      return response.data;
    },
  };

  // Friends endpoints
  friends = {
    getAll: async (): Promise<{ friends: any[] }> => {
      const response = await this.client.get('/friends');
      return response.data;
    },

    sendRequest: async (data: { userId: string }): Promise<{ message: string }> => {
      const response = await this.client.post('/friends/request', data);
      return response.data;
    },
  };

  // Groups endpoints
  groups = {
    getAll: async (): Promise<{ groups: any[] }> => {
      const response = await this.client.get('/groups');
      return response.data;
    },

    create: async (data: { name: string; description?: string; habitId?: string; privacy: 'public' | 'private' }): Promise<{ group: any; message: string }> => {
      const response = await this.client.post('/groups', data);
      return response.data;
    },
  };
}

const apiClient = new ApiClient();

export const authApi = apiClient.auth;
export const habitsApi = apiClient.habits;
export const usersApi = apiClient.users;
export const friendsApi = apiClient.friends;
export const groupsApi = apiClient.groups;

export default apiClient;
