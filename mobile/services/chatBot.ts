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
    ],
  },
  {
    keywords: ['walked', 'walk', 'walking', 'steps', 'hike', 'hiked'],
    category: 'health',
    responses: [
      "Walking is so underrated! 🚶 How long were you out?",
      "Every step counts! 👣 How was the walk?",
      "Love that you're staying active! 🌿 Was it a relaxing walk?",
    ],
  },
  {
    keywords: ['gym', 'workout', 'exercise', 'exercised', 'trained', 'training', 'lift', 'lifted', 'pushup', 'push-up', 'squat'],
    category: 'sport',
    responses: [
      "Beast mode! 💪 What did you work on today?",
      "Crushing it at the gym! 🔥 How was the session?",
      "That's dedication! 🏋️ How intense was it?",
    ],
  },
  {
    keywords: ['meditated', 'meditation', 'meditate', 'mindful', 'breathe', 'breathing', 'yoga'],
    category: 'mindfulness',
    responses: [
      "Finding your calm 🧘 How long did you meditate?",
      "Mindfulness is a superpower! ✨ How do you feel now?",
      "Love that you took time for yourself 🌸 Was your mind busy today?",
    ],
  },
  {
    keywords: ['read', 'reading', 'book', 'studied', 'study', 'studying', 'learned', 'learning', 'course'],
    category: 'learning',
    responses: [
      "Knowledge is power! 📚 What are you reading?",
      "Growing your mind! 🧠 How long did you study?",
      "That's awesome! 📖 Did you learn something interesting?",
    ],
  },
  {
    keywords: ['water', 'drank', 'hydrated', 'hydration', 'drink'],
    category: 'health',
    responses: [
      "Staying hydrated! 💧 How many glasses so far?",
      "Water is life! 🌊 Keep it up!",
      "Great habit! 💦 Are you hitting your daily goal?",
    ],
  },
  {
    keywords: ['slept', 'sleep', 'woke', 'wake', 'nap', 'rest', 'rested'],
    category: 'health',
    responses: [
      "Rest is so important! 😴 How many hours did you get?",
      "Good sleep = good habits! 🌙 How do you feel today?",
      "Sleep quality matters! ⭐ Did you sleep well?",
    ],
  },
  {
    keywords: ['cooked', 'cooking', 'meal', 'ate', 'eat', 'eating', 'healthy', 'salad', 'vegetables'],
    category: 'health',
    responses: [
      "Eating well! 🥗 What did you make?",
      "Fueling your body right! 🍳 Was it tasty?",
      "Healthy choices! 🥑 Are you meal prepping?",
    ],
  },
  {
    keywords: ['journal', 'journaling', 'wrote', 'write', 'writing', 'diary'],
    category: 'mindfulness',
    responses: [
      "Journaling is powerful! ✍️ What did you write about?",
      "Putting thoughts on paper 📝 How did it feel?",
      "Great reflection habit! 🪞 Any insights today?",
    ],
  },
  {
    keywords: ['cleaned', 'cleaning', 'organized', 'tidy', 'declutter'],
    category: 'productivity',
    responses: [
      "Clean space, clear mind! 🧹 How does it feel?",
      "Getting organized! 📦 What area did you tackle?",
      "Productivity boost! ✨ Feels good, right?",
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
];

// ─── General Responses ───────────────────────────────────────────

const GENERAL_RESPONSES = [
  "That's great to hear! 🌟 Tell me more about your habits today.",
  "I'm here to help you track your progress! 💪 What habit did you work on?",
  "Sounds good! 🌿 Did you complete any habits today?",
  "Keep going! Every small step matters 🚀",
  "I love your energy! ✨ What else have you been up to?",
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
    text: "Tell me about your habits today — like \"I just ran 5km\" or \"I meditated for 10 minutes\" and I'll log it for you! 📝",
    sender: 'mascot',
    timestamp: new Date(),
    quickReplies: ['I exercised today 💪', 'I read a book 📚', 'I drank water 💧', 'I meditated 🧘'],
  },
];

// ─── Chat Bot Engine ─────────────────────────────────────────────

let conversationState: 'idle' | 'follow_up' | 'difficulty_rating' = 'idle';
let lastDetectedCategory: string | null = null;
let followUpIndex = 0;

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
      responses.push(createMascotMessage(response));

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
