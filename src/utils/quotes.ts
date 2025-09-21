import { MotivationalQuote } from '../types';

// Collection of motivational quotes
export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    id: '1',
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb"
  },
  {
    id: '2',
    text: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier"
  },
  {
    id: '3',
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle"
  },
  {
    id: '4',
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain"
  },
  {
    id: '5',
    text: "Your habits will determine your future.",
    author: "Jack Canfield"
  },
  {
    id: '6',
    text: "Motivation is what gets you started. Habit is what keeps you going.",
    author: "Jim Ryun"
  },
  {
    id: '7',
    text: "The groundwork for all happiness is good health.",
    author: "Leigh Hunt"
  },
  {
    id: '8',
    text: "A journey of a thousand miles begins with a single step.",
    author: "Lao Tzu"
  },
  {
    id: '9',
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins"
  },
  {
    id: '10',
    text: "Don't wait for opportunity. Create it.",
    author: "Unknown"
  },
  {
    id: '11',
    text: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma"
  },
  {
    id: '12',
    text: "The pain of discipline weighs ounces, but the pain of regret weighs tons.",
    author: "Jim Rohn"
  },
  {
    id: '13',
    text: "You don't have to be great to get started, but you have to get started to be great.",
    author: "Les Brown"
  },
  {
    id: '14',
    text: "Progress, not perfection.",
    author: "Unknown"
  },
  {
    id: '15',
    text: "The compound effect of small, consistent actions is extraordinary.",
    author: "Darren Hardy"
  },
  {
    id: '16',
    text: "Champions are made from something deep inside them: a desire, a dream, a vision.",
    author: "Muhammad Ali"
  },
  {
    id: '17',
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney"
  },
  {
    id: '18',
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela"
  },
  {
    id: '19',
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    id: '20',
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi"
  },
  {
    id: '21',
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    id: '22',
    text: "The difference between ordinary and extraordinary is that little extra.",
    author: "Jimmy Johnson"
  },
  {
    id: '23',
    text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    author: "Ralph Waldo Emerson"
  },
  {
    id: '24',
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    id: '25',
    text: "Be yourself; everyone else is already taken.",
    author: "Oscar Wilde"
  },
  {
    id: '26',
    text: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein"
  },
  {
    id: '27',
    text: "Strive not to be a success, but rather to be of value.",
    author: "Albert Einstein"
  },
  {
    id: '28',
    text: "The only person you are destined to become is the person you decide to be.",
    author: "Ralph Waldo Emerson"
  },
  {
    id: '29',
    text: "Life is what happens to you while you're busy making other plans.",
    author: "John Lennon"
  },
  {
    id: '30',
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  }
];

// Get daily quote based on date (consistent for the same day)
export function getDailyQuote(date?: Date): MotivationalQuote {
  const today = date || new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[index];
}

// Get random quote
export function getRandomQuote(): MotivationalQuote {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
}

// Get quotes by category (if we add categories later)
export function getQuotesByCategory(category: string): MotivationalQuote[] {
  return MOTIVATIONAL_QUOTES.filter(quote => quote.category === category);
}