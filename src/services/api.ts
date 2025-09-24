import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Habit, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  HabitStats,
  ProfileStats,
  ProfileUpdateRequest,
  Group,
  CreateGroupRequest
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
      const userData = response.data.user;
      
      // Transform snake_case to camelCase
      const transformedUser = {
        ...userData,
        firstName: userData.first_name,
        lastName: userData.last_name,
        avatarColor: userData.avatar_color,
        avatarIcon: userData.avatar_icon,
        profilePhoto: userData.profile_photo,
        shareProgress: userData.share_progress,
        publicProfile: userData.public_profile,
        privacyLevel: userData.privacy_level,
        emailVerified: userData.email_verified,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        joinedAt: userData.created_at
      };
      
      return { user: transformedUser };
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

    complete: async (habitId: string, data?: { date?: string; notes?: string; mood?: string; value?: number }): Promise<{ message: string; completed: boolean; xpGained?: number; duplicatesSynced?: number }> => {
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
    getProfile: async (userId: string): Promise<User> => {
      const response = await this.client.get(`/users/${userId}`);
      return response.data;
    },

    getMyProfile: async (): Promise<User> => {
      const response = await this.client.get('/users/me/profile');
      const userData = response.data;
      
      // Transform snake_case to camelCase
      return {
        ...userData,
        firstName: userData.first_name,
        lastName: userData.last_name,
        avatarColor: userData.avatar_color,
        avatarIcon: userData.avatar_icon,
        profilePhoto: userData.profile_photo,
        shareProgress: userData.share_progress,
        publicProfile: userData.public_profile,
        privacyLevel: userData.privacy_level,
        emailVerified: userData.email_verified,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        joinedAt: userData.created_at
      };
    },

    updateProfile: async (data: ProfileUpdateRequest): Promise<User> => {
      const response = await this.client.put('/users/profile', data);
      const userData = response.data;
      
      // Transform snake_case to camelCase
      return {
        ...userData,
        firstName: userData.first_name,
        lastName: userData.last_name,
        avatarColor: userData.avatar_color,
        avatarIcon: userData.avatar_icon,
        profilePhoto: userData.profile_photo,
        shareProgress: userData.share_progress,
        publicProfile: userData.public_profile,
        privacyLevel: userData.privacy_level,
        emailVerified: userData.email_verified,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        joinedAt: userData.created_at
      };
    },

    getStats: async (): Promise<ProfileStats> => {
      const response = await this.client.get('/users/me/stats');
      return response.data;
    },

    getDiscoverUsers: async (params?: {
      search?: string;
      sortBy?: 'xp' | 'level' | 'streak' | 'recent';
      filterBy?: 'all' | 'public' | 'active';
    }): Promise<User[]> => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append('search', params.search);
      if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params?.filterBy) searchParams.append('filterBy', params.filterBy);
      
      const response = await this.client.get(`/users/discover?${searchParams.toString()}`);
      const users = response.data;
      
      // Transform each user's snake_case to camelCase
      return users.map((userData: any) => ({
        ...userData,
        firstName: userData.first_name,
        lastName: userData.last_name,
        avatarColor: userData.avatar_color,
        avatarIcon: userData.avatar_icon,
        profilePhoto: userData.profile_photo,
        shareProgress: userData.share_progress,
        publicProfile: userData.public_profile,
        privacyLevel: userData.privacy_level,
        emailVerified: userData.email_verified,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        joinedAt: userData.created_at,
        totalHabits: userData.total_habits,
        highestStreak: userData.highest_streak,
        successPercentage: userData.success_percentage,
        friendStatus: userData.friendStatus,
        mutualFriends: userData.mutualFriends,
        recentActivity: userData.recentActivity
      }));
    },
  };

  // Friends endpoints
  friends = {
    getAll: async (): Promise<{ friends: any[], sentRequests: any[], receivedRequests: any[] }> => {
      const response = await this.client.get('/friends');
      return response.data;
    },

    sendRequest: async (data: { userId: string }): Promise<{ message: string }> => {
      const response = await this.client.post('/friends/request', data);
      return response.data;
    },

    acceptRequest: async (data: { userId: string }): Promise<{ message: string }> => {
      const response = await this.client.post('/friends/accept', data);
      return response.data;
    },

    rejectRequest: async (data: { userId: string }): Promise<{ message: string }> => {
      const response = await this.client.post('/friends/reject', data);
      return response.data;
    },

    remove: async (data: { userId: string }): Promise<{ message: string }> => {
      const response = await this.client.delete('/friends/remove', { data });
      return response.data;
    },
  };

  // Groups endpoints
  groups = {
    getAll: async (filters?: { search?: string; status?: string; type?: string }): Promise<Group[]> => {
      const response = await this.client.get('/groups', { params: filters });
      return response.data;
    },

    getById: async (groupId: string): Promise<Group> => {
      const response = await this.client.get(`/groups/${groupId}`);
      return response.data;
    },

    create: async (groupData: CreateGroupRequest): Promise<{ message: string; group: Group }> => {
      const response = await this.client.post('/groups', groupData);
      return response.data;
    },

    join: async (groupId: string): Promise<{ message: string }> => {
      const response = await this.client.post(`/groups/${groupId}/join`);
      return response.data;
    },

    leave: async (groupId: string): Promise<{ message: string }> => {
      const response = await this.client.post(`/groups/${groupId}/leave`);
      return response.data;
    },

    markCompletion: async (groupId: string, data?: { date?: string; notes?: string }): Promise<{ message: string }> => {
      const response = await this.client.post(`/groups/${groupId}/complete`, data);
      return response.data;
    },

    removeCompletion: async (groupId: string, data: { date?: string }): Promise<{ message: string }> => {
      const response = await this.client.delete(`/groups/${groupId}/complete`, { data });
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
