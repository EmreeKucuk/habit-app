/**
 * API configuration for HabitFlow mobile app.
 * Points to the backend hosted on Render.
 */

export const API_BASE_URL = 'https://habit-app-backend-nfhj.onrender.com';

export const API_ENDPOINTS = {
  // Auth
  register: '/api/auth/register',
  login: '/api/auth/login',
  verifyEmail: '/api/auth/verify-email',
  forgotPassword: '/api/auth/forgot-password',
  resetPassword: '/api/auth/reset-password',
  me: '/api/auth/me',
  refresh: '/api/auth/refresh',

  // Habits
  habits: '/api/habits',
  habitComplete: (id: string) => `/api/habits/${id}/complete`,
  habitStats: '/api/habits/stats',

  // Users
  userProfile: '/api/users/me/profile',
  userStats: '/api/users/me/stats',
  updateProfile: '/api/users/profile',
  discoverUsers: '/api/users/discover',

  // Friends
  friends: '/api/friends',
  friendRequest: '/api/friends/request',
  friendAccept: '/api/friends/accept',
  friendReject: '/api/friends/reject',
  friendRemove: '/api/friends/remove',

  // Motivation
  motivationLog: '/api/motivation/log',
  motivationScore: '/api/motivation/score',
  motivationChat: '/api/motivation/chat',
  motivationChatHistory: '/api/motivation/chat/history',
  motivationInsights: '/api/motivation/insights',

  // Health
  health: '/api/health',
} as const;
