export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  bio?: string;
  avatarColor: string;
  avatarIcon?: string;
  profilePhoto?: string;
  xp: number;
  level: number;
  shareProgress: boolean;
  publicProfile: boolean;
  privacyLevel?: 'public' | 'friends' | 'private'; // New field for unified privacy
  joinedAt: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  badges?: Badge[];
  totalHabits?: number;
  highestStreak?: number;
  successPercentage?: number;
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
  description: string;
  habit_name: string;
  habit_category: string;
  creator_id: string;
  creator_username: string;
  creator_first_name: string;
  creator_last_name: string;
  start_date: string;
  end_date: string;
  target_frequency: number;
  is_public: boolean;
  status: 'upcoming' | 'active' | 'completed';
  member_count: number;
  is_member: boolean;
  is_creator?: boolean;
  members?: GroupMember[];
  created_at: string;
}

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_color: string;
  avatar_icon: string;
  role: 'admin' | 'member';
  total_completions: number;
  completion_rate: number;
  current_streak: number;
  last_completion_date: string;
  rank: number;
  daily_completions: Record<string, boolean>;
  joined_at: string;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  habit_name: string;
  habit_category: string;
  start_date: string;
  end_date: string;
  target_frequency: number;
  is_public: boolean;
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
  emailOrUsername: string;
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

export interface ProfileStats {
  totalHabits: number;
  completedToday: number;
  currentStreak: number;
  longestStreak: number;
  successPercentage: number;
  totalCompletions: number;
  weeklyAverage: number;
  categoryBreakdown: { [key in HabitCategory]?: number };
}

export interface MotivationalQuote {
  id: string;
  text: string;
  author: string;
  category?: string;
}

export interface ProfileUpdateRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  bio?: string;
  avatarIcon?: string;
  profilePhoto?: string;
  shareProgress?: boolean;
  publicProfile?: boolean;
  privacyLevel?: 'public' | 'friends' | 'private'; // New field for unified privacy
}
