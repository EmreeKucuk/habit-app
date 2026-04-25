/**
 * Motivation Service — Bridges the chat bot with the backend motivation API.
 * Logs difficulty ratings, mood data, and fetches the motivation score
 * to dynamically adjust the mascot's tone.
 */

import { API_ENDPOINTS } from '@/constants/api';
import api from '@/services/api';

export interface MotivationScore {
  score: number;
  level: 'low' | 'medium' | 'high';
  mascotTone: {
    greeting: string;
    encouragement: string;
    style: 'energetic' | 'supportive' | 'gentle';
  };
  breakdown: {
    streak: { score: number; max: number; currentStreak: number };
    consistency: { score: number; max: number; rate: number };
    difficulty: { score: number; max: number; avgDifficulty: number };
    recency: { score: number; max: number; daysSinceLastLog: number };
  };
}

export interface MotivationInsights {
  recentAvgDifficulty: number | null;
  totalRecentLogs: number;
  moodDistribution: { mood: string; count: number }[];
  topCategories: { habit_category: string; count: number; avg_difficulty: number }[];
  dailyTrend: { date: string; avg_difficulty: number; log_count: number }[];
}

// ─── Fetch Motivation Score ──────────────────────────────────────

export async function fetchMotivationScore(): Promise<MotivationScore | null> {
  try {
    const { data, error } = await api.get<MotivationScore>(API_ENDPOINTS.motivationScore);
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

// ─── Log Motivation Data ─────────────────────────────────────────

export async function logMotivation(params: {
  habitCategory?: string;
  difficultyRating?: number;
  mood?: string;
}): Promise<boolean> {
  try {
    const { error } = await api.post(API_ENDPOINTS.motivationLog, params);
    return !error;
  } catch {
    return false;
  }
}

// ─── Save Chat Message ───────────────────────────────────────────

export async function saveChatMessage(params: {
  sender: 'user' | 'mascot';
  message: string;
  habitCategory?: string;
  difficultyRating?: number;
  mood?: string;
}): Promise<boolean> {
  try {
    const { error } = await api.post(API_ENDPOINTS.motivationChat, params);
    return !error;
  } catch {
    return false;
  }
}

// ─── Load Chat History ───────────────────────────────────────────

export async function loadChatHistory(limit = 50): Promise<{
  id: string;
  sender: 'user' | 'mascot';
  message: string;
  created_at: string;
}[]> {
  try {
    const { data, error } = await api.get<{
      messages: { id: string; sender: 'user' | 'mascot'; message: string; created_at: string }[];
    }>(`${API_ENDPOINTS.motivationChatHistory}?limit=${limit}`);
    if (error || !data) return [];
    return data.messages;
  } catch {
    return [];
  }
}

// ─── Fetch Insights ──────────────────────────────────────────────

export async function fetchInsights(): Promise<MotivationInsights | null> {
  try {
    const { data, error } = await api.get<MotivationInsights>(API_ENDPOINTS.motivationInsights);
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

// ─── Dynamic Greeting Based on Score ─────────────────────────────

export function getMotivationGreeting(score: MotivationScore | null): string {
  if (!score) return "Hey there! 🌱 Tell me about your habits today!";

  const { level, mascotTone } = score;
  const streak = score.breakdown.streak.currentStreak;

  if (level === 'high') {
    if (streak >= 7) return `${mascotTone.greeting} ${streak}-day streak! You're unstoppable! 🚀`;
    return `${mascotTone.greeting} You're doing amazing! What's on the agenda today? 💪`;
  }

  if (level === 'medium') {
    if (streak >= 3) return `${mascotTone.greeting} ${streak} days in a row — nice! Let's keep going! 🌟`;
    return `${mascotTone.greeting} Ready to build some momentum today? ✨`;
  }

  // Low motivation
  if (score.breakdown.recency.daysSinceLastLog > 3) {
    return `${mascotTone.greeting} It's been a few days — no pressure, let's start small today 🌿`;
  }
  return `${mascotTone.greeting} ${mascotTone.encouragement}`;
}

// ─── Dynamic Response Modifier ───────────────────────────────────

export function adjustResponseForMotivation(
  baseResponse: string,
  score: MotivationScore | null,
): string {
  if (!score) return baseResponse;

  const { level } = score;

  if (level === 'high') {
    // Add extra enthusiasm
    return baseResponse.replace('!', '!! 🔥');
  }

  if (level === 'low') {
    // Add extra gentleness
    if (baseResponse.includes('how difficult')) {
      return "No need to push too hard — on a scale of 1-5, how was it? Take your time 💚";
    }
  }

  return baseResponse;
}
