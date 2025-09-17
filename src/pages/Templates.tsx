import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Star } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';
import { HabitCategory, HabitFrequency } from '../types';

interface HabitTemplate {
  id: string;
  name: string;
  description: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  target: number;
  unit: string;
  color: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  popularity: number;
}

const HABIT_TEMPLATES: HabitTemplate[] = [
  // Health & Fitness
  {
    id: '1',
    name: 'Drink 8 Glasses of Water',
    description: 'Stay hydrated by drinking at least 8 glasses of water throughout the day',
    category: 'health',
    frequency: 'daily',
    target: 8,
    unit: 'glasses',
    color: '#06B6D4',
    icon: '💧',
    difficulty: 'easy',
    tags: ['hydration', 'health', 'wellness'],
    popularity: 95
  },
  {
    id: '2',
    name: 'Morning Workout',
    description: 'Start your day with 30 minutes of exercise to boost energy and mood',
    category: 'sport',
    frequency: 'daily',
    target: 30,
    unit: 'minutes',
    color: '#EF4444',
    icon: '💪',
    difficulty: 'medium',
    tags: ['fitness', 'morning routine', 'energy'],
    popularity: 87
  },
  {
    id: '3',
    name: 'Meditation',
    description: 'Practice mindfulness and reduce stress with daily meditation',
    category: 'mindfulness',
    frequency: 'daily',
    target: 15,
    unit: 'minutes',
    color: '#8B5CF6',
    icon: '🧘',
    difficulty: 'easy',
    tags: ['mindfulness', 'stress relief', 'mental health'],
    popularity: 92
  },
  {
    id: '4',
    name: 'Walk 10,000 Steps',
    description: 'Maintain an active lifestyle by walking at least 10,000 steps daily',
    category: 'health',
    frequency: 'daily',
    target: 10000,
    unit: 'steps',
    color: '#10B981',
    icon: '🚶',
    difficulty: 'medium',
    tags: ['walking', 'fitness', 'cardio'],
    popularity: 89
  },
  
  // Learning & Productivity
  {
    id: '5',
    name: 'Read for 30 Minutes',
    description: 'Expand your knowledge and vocabulary by reading every day',
    category: 'learning',
    frequency: 'daily',
    target: 30,
    unit: 'minutes',
    color: '#F59E0B',
    icon: '📚',
    difficulty: 'easy',
    tags: ['reading', 'knowledge', 'personal growth'],
    popularity: 84
  },
  {
    id: '6',
    name: 'Learn a New Language',
    description: 'Practice a foreign language for 20 minutes daily',
    category: 'learning',
    frequency: 'daily',
    target: 20,
    unit: 'minutes',
    color: '#3B82F6',
    icon: '🌍',
    difficulty: 'medium',
    tags: ['language', 'communication', 'culture'],
    popularity: 76
  },
  {
    id: '7',
    name: 'Journal Writing',
    description: 'Reflect on your day and thoughts through daily journaling',
    category: 'mindfulness',
    frequency: 'daily',
    target: 10,
    unit: 'minutes',
    color: '#EC4899',
    icon: '✍️',
    difficulty: 'easy',
    tags: ['writing', 'reflection', 'mental health'],
    popularity: 81
  },
  {
    id: '8',
    name: 'No Social Media Before Noon',
    description: 'Improve focus and productivity by avoiding social media in the morning',
    category: 'productivity',
    frequency: 'daily',
    target: 1,
    unit: 'day',
    color: '#6366F1',
    icon: '🚫',
    difficulty: 'hard',
    tags: ['digital detox', 'focus', 'productivity'],
    popularity: 73
  },

  // Sleep & Wellness
  {
    id: '9',
    name: 'Sleep 8 Hours',
    description: 'Maintain a healthy sleep schedule by getting 8 hours of quality sleep',
    category: 'health',
    frequency: 'daily',
    target: 8,
    unit: 'hours',
    color: '#14B8A6',
    icon: '💤',
    difficulty: 'medium',
    tags: ['sleep', 'rest', 'recovery'],
    popularity: 88
  },
  {
    id: '10',
    name: 'Eat 5 Servings of Fruits & Vegetables',
    description: 'Boost your nutrition with at least 5 servings of fruits and vegetables daily',
    category: 'health',
    frequency: 'daily',
    target: 5,
    unit: 'servings',
    color: '#84CC16',
    icon: '🍎',
    difficulty: 'medium',
    tags: ['nutrition', 'healthy eating', 'vitamins'],
    popularity: 79
  },

  // Social & Personal
  {
    id: '11',
    name: 'Call Family/Friends',
    description: 'Maintain relationships by calling family or friends regularly',
    category: 'social',
    frequency: 'weekly',
    target: 3,
    unit: 'calls',
    color: '#F97316',
    icon: '📞',
    difficulty: 'easy',
    tags: ['relationships', 'family', 'friends'],
    popularity: 85
  },
  {
    id: '12',
    name: 'Practice Gratitude',
    description: 'Write down 3 things you\'re grateful for each day',
    category: 'mindfulness',
    frequency: 'daily',
    target: 3,
    unit: 'items',
    color: '#F87171',
    icon: '🙏',
    difficulty: 'easy',
    tags: ['gratitude', 'positivity', 'mental health'],
    popularity: 90
  }
];

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'difficulty' | 'name'>('popularity');

  const handleUseTemplate = async (template: HabitTemplate) => {
    setLoading(template.id);
    try {
      await api.habits.create({
        name: template.name,
        notes: template.description,
        category: template.category,
        frequency: template.frequency,
        target: template.target,
        unit: template.unit,
        color: template.color,
        icon: template.icon
      });

      navigate('/dashboard', {
        state: { message: `Added "${template.name}" habit from template!` }
      });
    } catch (error: any) {
      console.error('Error creating habit from template:', error);
      alert('Failed to create habit. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const filteredTemplates = React.useMemo(() => {
    let filtered = HABIT_TEMPLATES;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, sortBy]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Habit Templates
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Quick-start your habit journey with proven templates
            </p>
          </div>
          <button
            onClick={() => navigate('/add-habit')}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Habit
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as HabitCategory | 'all')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="health">Health</option>
              <option value="sport">Sport</option>
              <option value="learning">Learning</option>
              <option value="productivity">Productivity</option>
              <option value="mindfulness">Mindfulness</option>
              <option value="social">Social</option>
              <option value="other">Other</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popularity' | 'difficulty' | 'name')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="popularity">Most Popular</option>
              <option value="difficulty">By Difficulty</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: template.color }}
                  >
                    {template.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                      {template.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                        {template.difficulty}
                      </span>
                      <div className="flex items-center text-yellow-500">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                          {template.popularity}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Details */}
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="capitalize">{template.frequency}</span>
                <span>{template.target} {template.unit}</span>
                <span className="capitalize">{template.category}</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleUseTemplate(template)}
                disabled={loading === template.id}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors font-medium"
              >
                {loading === template.id ? 'Adding...' : 'Use This Template'}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Filter className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No templates found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Templates;
