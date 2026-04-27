/**
 * ChatBot — Local mascot chat logic for HabitFlow.
 * Detects habit logging, asks follow-up questions, and provides encouragement.
 * In Phase 6, this will integrate with the backend motivation algorithm.
 */

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'mascot';
  timestamp: Date;
  quickReplies?: string[];
  habitDetected?: string;
}

// ─── Habit Keywords ──────────────────────────────────────────────

interface HabitPattern {
  keywords: string[];
  category: string;
  responses: string[];
}

const HABIT_PATTERNS: HabitPattern[] = [
  {
    keywords: ['ran', 'run', 'running', 'jogged', 'jogging', 'sprint'],
    category: 'sport',
    responses: [
      "Nice run! 🏃 How far did you go?",
      "Great job getting out there! 💪 How did the run feel?",
      "Running is amazing for you! 🌟 Was it a tough one today?",
      "Whoosh! 💨 You're speedy! Did you beat your personal best?",
      "Running clears the mind, doesn't it? 🌿 How are your legs feeling?",
      "That's some serious cardio! ❤️ Keep up the great work!",
    ],
  },
  {
    keywords: ['walked', 'walk', 'walking', 'steps', 'hike', 'hiked'],
    category: 'health',
    responses: [
      "Walking is so underrated! 🚶 How long were you out?",
      "Every step counts! 👣 How was the walk?",
      "Love that you're staying active! 🌿 Was it a relaxing walk?",
      "Getting outside does wonders for the soul! ☀️ See anything interesting?",
      "A good walk is my favorite! 🌳 Did you go anywhere new?",
      "Stretching those legs! 🦵 Great job hitting your step goals!",
    ],
  },
  {
    keywords: ['gym', 'workout', 'exercise', 'exercised', 'trained', 'training', 'lift', 'lifted', 'pushup', 'push-up', 'squat'],
    category: 'sport',
    responses: [
      "Beast mode! 💪 What did you work on today?",
      "Crushing it at the gym! 🔥 How was the session?",
      "That's dedication! 🏋️ How intense was it?",
      "Pumping iron! 🦾 Are you feeling the burn yet?",
      "You're getting stronger every day! 📈 What was your favorite exercise?",
      "Sweat is just weakness leaving the body! 💦 Great workout!",
    ],
  },
  {
    keywords: ['meditated', 'meditation', 'meditate', 'mindful', 'breathe', 'breathing', 'yoga'],
    category: 'mindfulness',
    responses: [
      "Finding your calm 🧘 How long did you meditate?",
      "Mindfulness is a superpower! ✨ How do you feel now?",
      "Love that you took time for yourself 🌸 Was your mind busy today?",
      "Namaste! 🙏 Taking a breather is so important. Do you feel centered?",
      "Inhale... exhale... 🌬️ Sounds like a wonderful mindful moment.",
      "Yoga and meditation are the best ways to ground yourself. 🌍 Good job!",
    ],
  },
  {
    keywords: ['read', 'reading', 'book', 'studied', 'study', 'studying', 'learned', 'learning', 'course'],
    category: 'learning',
    responses: [
      "Knowledge is power! 📚 What are you reading?",
      "Growing your mind! 🧠 How long did you study?",
      "That's awesome! 📖 Did you learn something interesting?",
      "Leveling up your brain! 🎓 What's the topic today?",
      "A chapter a day keeps the mind sharp! 🤓 Enjoying the material?",
      "Always be learning! 💡 Was it a difficult subject?",
    ],
  },
  {
    keywords: ['water', 'drank', 'hydrated', 'hydration', 'drink'],
    category: 'health',
    responses: [
      "Staying hydrated! 💧 How many glasses so far?",
      "Water is life! 🌊 Keep it up!",
      "Great habit! 💦 Are you hitting your daily goal?",
      "Gulp gulp! 🚰 Nothing beats a cold glass of water. Feel refreshed?",
      "Your skin and brain will thank you for this! 🧊 Good job hydrating!",
    ],
  },
  {
    keywords: ['slept', 'sleep', 'woke', 'wake', 'nap', 'rest', 'rested'],
    category: 'health',
    responses: [
      "Rest is so important! 😴 How many hours did you get?",
      "Good sleep = good habits! 🌙 How do you feel today?",
      "Sleep quality matters! ⭐ Did you sleep well?",
      "Catching those Zzzs! 🛌 Feeling energized?",
      "A well-rested mind is a productive mind! 🌅 Ready for the day?",
    ],
  },
  {
    keywords: ['cooked', 'cooking', 'meal', 'ate', 'eat', 'eating', 'healthy', 'salad', 'vegetables'],
    category: 'health',
    responses: [
      "Eating well! 🥗 What did you make?",
      "Fueling your body right! 🍳 Was it tasty?",
      "Healthy choices! 🥑 Are you meal prepping?",
      "Master chef in the house! 🧑‍🍳 Did it turn out well?",
      "Good food is good mood! 🍲 Bon appétit!",
    ],
  },
  {
    keywords: ['journal', 'journaling', 'wrote', 'write', 'writing', 'diary'],
    category: 'mindfulness',
    responses: [
      "Journaling is powerful! ✍️ What did you write about?",
      "Putting thoughts on paper 📝 How did it feel?",
      "Great reflection habit! 🪞 Any insights today?",
      "Capturing moments! 📔 Is your journal filling up?",
      "Writing is thinking! 🖋️ Did it help clear your mind?",
    ],
  },
  {
    keywords: ['cleaned', 'cleaning', 'organized', 'tidy', 'declutter'],
    category: 'productivity',
    responses: [
      "Clean space, clear mind! 🧹 How does it feel?",
      "Getting organized! 📦 What area did you tackle?",
      "Productivity boost! ✨ Feels good, right?",
      "Sparking joy! 🪄 Everything in its right place?",
      "A tidy environment does wonders! 🧺 Great job sorting things out!",
    ],
  },
];

// ─── Follow-up Questions ─────────────────────────────────────────

const FOLLOW_UP_QUESTIONS = [
  {
    text: "On a scale of 1-5, how difficult was that? 🤔",
    quickReplies: ['1 - Easy', '2 - Light', '3 - Moderate', '4 - Hard', '5 - Very Hard'],
  },
  {
    text: "How are you feeling after that? 😊",
    quickReplies: ['Amazing! 🔥', 'Pretty good 😊', 'Okay 😐', 'Tired 😴', 'Struggling 😔'],
  },
  {
    text: "Would you like to do more of this? 🌱",
    quickReplies: ['Definitely!', 'Maybe tomorrow', 'Need a break'],
  },
  {
    text: "What was the best part of doing it? ✨",
    quickReplies: ['Finishing it! 🎉', 'The process 🧘', 'Feeling productive 💪'],
  },
  {
    text: "Did you encounter any challenges? 🧗",
    quickReplies: ['No, smooth sailing! ⛵', 'A little bit 🤏', 'Yes, it was tough 🧱'],
  }
];

// ─── General Responses ───────────────────────────────────────────

const GENERAL_RESPONSES = [
  "That's great to hear! 🌟 Tell me more about your habits today.",
  "I'm here to help you track your progress! 💪 What habit did you work on?",
  "Sounds good! 🌿 Did you complete any habits today?",
  "Keep going! Every small step matters 🚀",
  "I love your energy! ✨ What else have you been up to?",
  "Fascinating! 🧐 Let's make sure we log your core habits though—did you exercise, read, or meditate?",
  "Oh, I see! 🌱 By the way, have you hit your water goal for today?",
  "Got it! 📝 Don't forget, I'm here to log your daily routines. What's on the checklist today?",
];

const GREETING_MESSAGES: ChatMessage[] = [
  {
    id: 'greeting-1',
    text: "Hey there! 🌱 I'm Sprout, your habit buddy!",
    sender: 'mascot',
    timestamp: new Date(),
  },
  {
    id: 'greeting-2',
    text: "Tell me about your habits today — or just tap one of your quick replies below! 📝",
    sender: 'mascot',
    timestamp: new Date(),
    quickReplies: ['I exercised today 💪', 'I read a book 📚', 'I drank water 💧', 'I meditated 🧘'],
  },
];

// ─── Chat Bot Engine ─────────────────────────────────────────────

let conversationState: 'idle' | 'follow_up' | 'difficulty_rating' | 'creating_habit_name' | 'creating_habit_category' | 'creating_habit_frequency' = 'idle';
let lastDetectedCategory: string | null = null;
let followUpIndex = 0;

// In-progress habit creation data
let newHabitData: { name?: string; category?: string; frequency?: string } = {};

const HABIT_CATEGORIES = [
  { id: 'health', label: '💚 Health', icon: '💚' },
  { id: 'sport', label: '🏃 Sport', icon: '🏃' },
  { id: 'mindfulness', label: '🧘 Mindfulness', icon: '🧘' },
  { id: 'learning', label: '📚 Learning', icon: '📚' },
  { id: 'productivity', label: '⚡ Productivity', icon: '⚡' },
  { id: 'social', label: '🤝 Social', icon: '🤝' },
  { id: 'other', label: '🌱 Other', icon: '🌱' },
];

const HABIT_FREQUENCIES = ['Daily', 'Weekly', 'Monthly'];

export function getGreetingMessages(): ChatMessage[] {
  conversationState = 'idle';
  lastDetectedCategory = null;
  followUpIndex = 0;
  return GREETING_MESSAGES.map((msg, i) => ({
    ...msg,
    timestamp: new Date(Date.now() + i * 500),
  }));
}

export function getLastDetectedCategory(): string | null {
  return lastDetectedCategory;
}

export function generateBotResponse(userMessage: string): ChatMessage[] {
  const text = userMessage.toLowerCase().trim();
  const responses: ChatMessage[] = [];

  // ── Habit Creation Flow ──
  if (conversationState === 'creating_habit_name') {
    newHabitData.name = userMessage.trim(); // keep original casing
    responses.push(
      createMascotMessage(
        `"${newHabitData.name}" — love it! 🌟 Now, which category does it belong to?`,
        HABIT_CATEGORIES.map((c) => c.label),
      ),
    );
    conversationState = 'creating_habit_category';
    return responses;
  }

  if (conversationState === 'creating_habit_category') {
    // Match the user input to a category
    const matchedCategory = HABIT_CATEGORIES.find(
      (c) => text.includes(c.id) || text.includes(c.label.toLowerCase()),
    );
    newHabitData.category = matchedCategory?.id || 'other';
    const catLabel = matchedCategory?.label || '🌱 Other';
    responses.push(
      createMascotMessage(
        `Got it — ${catLabel}! How often do you want to do this?`,
        HABIT_FREQUENCIES,
      ),
    );
    conversationState = 'creating_habit_frequency';
    return responses;
  }

  if (conversationState === 'creating_habit_frequency') {
    // Match frequency
    if (text.includes('daily')) newHabitData.frequency = 'daily';
    else if (text.includes('weekly')) newHabitData.frequency = 'weekly';
    else if (text.includes('monthly')) newHabitData.frequency = 'monthly';
    else newHabitData.frequency = 'daily';

    responses.push(
      createMascotMessage(
        `Perfect! Here's what I've got:\n\n📝 **${newHabitData.name}**\n📂 ${newHabitData.category}\n🔄 ${newHabitData.frequency}\n\nCreating it now... ✨`,
      ),
    );
    conversationState = 'idle';
    return responses;
  }

  // Check if user is answering a difficulty rating
  if (conversationState === 'difficulty_rating') {
    const difficultyMatch = text.match(/[1-5]/);
    if (difficultyMatch) {
      const difficulty = parseInt(difficultyMatch[0]);
      let reaction = '';
      if (difficulty <= 2) {
        reaction = "That's great — keep the momentum going! 🚀";
      } else if (difficulty <= 3) {
        reaction = "Nice work pushing through! You're building resilience 💪";
      } else {
        reaction = "I'm proud of you for doing it even when it's hard! That's real strength 🌟";
      }

      responses.push(createMascotMessage(reaction));
      responses.push(
        createMascotMessage(
          "What else have you been up to today? 🌿",
          ['I did another habit', 'That was it for today', 'Show my progress'],
        ),
      );
      conversationState = 'idle';
      return responses;
    }
  }

  // Check for follow-up answers (mood/feeling responses)
  if (conversationState === 'follow_up') {
    const positiveWords = ['amazing', 'great', 'good', 'awesome', 'fantastic', 'definitely', 'love'];
    const negativeWords = ['tired', 'struggling', 'hard', 'difficult', 'bad', 'tough', 'break'];

    const isPositive = positiveWords.some((w) => text.includes(w));
    const isNegative = negativeWords.some((w) => text.includes(w));

    if (isPositive) {
      responses.push(createMascotMessage("That's the spirit! You're doing amazing! 🎉"));
    } else if (isNegative) {
      responses.push(
        createMascotMessage("Hey, it's okay! The fact that you showed up is what matters 💚 Be gentle with yourself."),
      );
    } else {
      responses.push(createMascotMessage("Thanks for sharing! Every bit of honesty helps 🌱"));
    }

    // Ask difficulty rating
    const diffQ = FOLLOW_UP_QUESTIONS[0];
    responses.push(createMascotMessage(diffQ.text, diffQ.quickReplies));
    conversationState = 'difficulty_rating';
    return responses;
  }

  // Check for habit patterns
  for (const pattern of HABIT_PATTERNS) {
    const matched = pattern.keywords.some((keyword) => text.includes(keyword));
    if (matched) {
      lastDetectedCategory = pattern.category;
      const response = pattern.responses[Math.floor(Math.random() * pattern.responses.length)];
      const msg = createMascotMessage(response);
      msg.habitDetected = pattern.category;
      responses.push(msg);

      // Set state to expect follow-up
      conversationState = 'follow_up';
      return responses;
    }
  }

  // Check for "progress" or "stats" requests
  if (text.includes('progress') || text.includes('stats') || text.includes('streak')) {
    responses.push(
      createMascotMessage(
        "Head over to the Home tab to see your full progress dashboard! 📊 Your heatmap and streak are waiting there 🔥",
      ),
    );
    conversationState = 'idle';
    return responses;
  }

  // Check for "that was it" / end of logging
  if (text.includes('that was it') || text.includes('done for today') || text.includes('nothing else')) {
    responses.push(
      createMascotMessage(
        "Great job today! 🌟 Remember, consistency is key. See you tomorrow! 💚",
        ['Thanks Sprout! 😊', 'See you tomorrow! 👋'],
      ),
    );
    conversationState = 'idle';
    return responses;
  }

  // General / unrecognized response
  const generalResponse = GENERAL_RESPONSES[Math.floor(Math.random() * GENERAL_RESPONSES.length)];
  responses.push(
    createMascotMessage(generalResponse, [
      'I exercised today 💪',
      'I read a book 📚',
      'I meditated 🧘',
    ]),
  );
  conversationState = 'idle';
  return responses;
}

function createMascotMessage(text: string, quickReplies?: string[]): ChatMessage {
  return {
    id: `mascot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    sender: 'mascot',
    timestamp: new Date(),
    quickReplies,
  };
}

export function createUserMessage(text: string): ChatMessage {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    sender: 'user',
    timestamp: new Date(),
  };
}

/**
 * Start the habit creation conversation flow.
 * Returns the initial Sprout message asking for a habit name.
 */
export function startHabitCreationFlow(): ChatMessage[] {
  newHabitData = {};
  conversationState = 'creating_habit_name';
  return [
    createMascotMessage(
      "Awesome, let's create a new habit! 🌱\n\nWhat would you like to call it?",
    ),
  ];
}

/**
 * Returns true if the bot is in the middle of creating a habit
 * and the final step just completed (frequency was set).
 */
export function isHabitCreationComplete(): boolean {
  return (
    conversationState === 'idle' &&
    !!newHabitData.name &&
    !!newHabitData.category &&
    !!newHabitData.frequency
  );
}

/**
 * Get the pending new habit data and clear it.
 */
export function consumeNewHabitData(): { name: string; category: string; frequency: string } | null {
  if (newHabitData.name && newHabitData.category && newHabitData.frequency) {
    const data = { name: newHabitData.name, category: newHabitData.category, frequency: newHabitData.frequency };
    newHabitData = {};
    return data;
  }
  return null;
}

import api from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

export async function processHabitLoggingAsync(category: string): Promise<void> {
  try {
    // Fetch user's habits
    const { data } = await api.get<{ habits: any[] }>(API_ENDPOINTS.habits);
    const habits = data?.habits || [];

    // Find the first habit that matches the category
    const matchingHabit = habits.find((h: any) => h.category === category);

    const today = new Date().toISOString().split('T')[0];

    if (matchingHabit) {
      // Complete the habit for today
      await api.post(API_ENDPOINTS.habitComplete(matchingHabit.id), { date: today });
    } else {
      // Create a new habit for this category
      const defaultNames: Record<string, string> = {
        'sport': 'Exercise',
        'health': 'Healthy Choice',
        'mindfulness': 'Mindfulness Practice',
        'learning': 'Learning Session',
        'productivity': 'Productive Work',
      };
      const name = defaultNames[category] || 'New Habit';
      
      const createRes = await api.post<{ habit: any }>(API_ENDPOINTS.habits, {
        name,
        category,
        frequency: 'daily',
      });

      if (createRes.data?.habit) {
        // Complete the newly created habit
        await api.post(API_ENDPOINTS.habitComplete(createRes.data.habit.id), { date: today });
      }
    }
  } catch (error) {
    console.log('Error processing habit log in backend:', error);
  }
}
