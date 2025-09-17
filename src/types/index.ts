export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatarColor: string;
  xp: number;
  level: number;
  shareProgress: boolean;
  publicProfile: boolean;
  joinedAt: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedDates: string[];
  streak: number;
  comments: HabitComment[];
  target?: number;
  unit?: string;
  color?: string;
  icon?: string;
}

export interface HabitComment {
  id: string;
  habitId: string;
  date: string;
  text: string;
  mood: Mood;
  timestamp: string;
}

export interface Friend {
  id: string;
  username: string;
  bio?: string;
  avatarColor: string;
  xp: number;
  level: number;
  habits: number;
  publicProfile: boolean;
  status: 'pending' | 'accepted' | 'declined';
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  habitId: string;
  habitName: string;
  privacy: 'public' | 'private';
  createdBy: string;
  members: GroupMember[];
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  username: string;
  avatarColor: string;
  xp: number;
  joinedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface HabitStats {
  totalHabits: number;
  completedToday: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  weeklyProgress: number[];
  monthlyProgress: number[];
  categoryBreakdown: Record<HabitCategory, number>;
}

export type HabitCategory = 
  | 'health'
  | 'sport'
  | 'learning'
  | 'productivity'
  | 'mindfulness'
  | 'social'
  | 'other';

export type HabitFrequency = 
  | 'daily'
  | 'weekly'
  | 'monthly';

export type Mood = 
  | 'excellent'
  | 'good'
  | 'okay'
  | 'bad'
  | 'terrible';

export type FilterType = 
  | 'all'
  | 'completed'
  | 'pending'
  | 'category';

export type SortType = 
  | 'name'
  | 'created'
  | 'streak'
  | 'category';
