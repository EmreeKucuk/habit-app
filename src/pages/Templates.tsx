import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Star, AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout';
import { habitsApi } from '../services/api';
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
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'difficulty' | 'name'>('popularity');

  // Fetch existing habits to check for duplicates
  const { data: existingHabits } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitsApi.getAll(),
  });

  // Create habit mutation
  const createHabitMutation = useMutation({
    mutationFn: (habitData: any) => habitsApi.create(habitData),
    onSuccess: (data, variables) => {
      // Invalidate habits queries to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      
      navigate('/dashboard', {
        state: { message: `Added "${variables.name}" habit from template!` }
      });
    },
    onError: (error: any) => {
      console.error('Error creating habit from template:', error);
      alert('Failed to create habit. Please try again.');
    }
  });

  const checkForDuplicate = (templateName: string): boolean => {
    if (!existingHabits?.habits) return false;
    return existingHabits.habits.some(habit => 
      habit.name.toLowerCase() === templateName.toLowerCase()
    );
  };

  const handleUseTemplate = async (template: HabitTemplate) => {
    // Check for duplicate
    if (checkForDuplicate(template.name)) {
      const confirmed = window.confirm(
        `⚠️ You already have a habit named "${template.name}".\n\n` +
        'Adding duplicate habits can make tracking confusing and less effective.\n\n' +
        'Are you sure you want to add this duplicate habit?'
      );
      
      if (!confirmed) {
        return;
      }
    }

    createHabitMutation.mutate({
      name: template.name,
      notes: template.description,
      category: template.category,
      frequency: template.frequency,
      target: template.target,
      unit: template.unit,
      color: template.color,
      icon: template.icon
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-[#A3B18A]/30 text-[#344E41] border border-[#A3B18A]/40';
      case 'medium': return 'bg-[#E9C46A]/30 text-[#344E41] border border-[#E9C46A]/40';
      case 'hard': return 'bg-red-400/30 text-[#344E41] border border-red-400/40';
      default: return 'bg-gray-100 text-[#344E41]';
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-[#344E41] mb-2 tracking-tight">
              Habit Templates
            </h1>
            <p className="text-[#344E41] opacity-70 font-medium">
              Quick-start your habit journey with proven templates
            </p>
          </div>
          <button
            onClick={() => navigate('/add-habit')}
            className="mt-4 sm:mt-0 inline-flex items-center justify-center px-6 py-3.5 bg-[#344E41] text-[#FEFAE0] font-bold rounded-xl hover:bg-[#2a3f35] transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Custom Habit
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#A3B18A]/10 border border-[#A3B18A]/20 rounded-3xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#344E41] opacity-40 w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-none rounded-xl bg-[#FEFAE0] text-[#344E41] font-medium focus:ring-2 focus:ring-[#E9C46A] placeholder-[#344E41]/30 transition-shadow"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as HabitCategory | 'all')}
              className="px-4 py-3.5 border-none rounded-xl bg-[#FEFAE0] text-[#344E41] font-bold focus:ring-2 focus:ring-[#E9C46A] transition-shadow appearance-none"
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
              className="px-4 py-3.5 border-none rounded-xl bg-[#FEFAE0] text-[#344E41] font-bold focus:ring-2 focus:ring-[#E9C46A] transition-shadow appearance-none"
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
              className="bg-[#FEFAE0] rounded-3xl p-6 shadow-[0_4px_20px_rgb(52,78,65,0.05)] hover:shadow-[0_8px_30px_rgb(52,78,65,0.08)] transition-all duration-300 border border-[#344E41]/5 flex flex-col h-full"
            >
              {/* Header */}
              <div className="flex items-start space-x-4 mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: template.color }}
                >
                  {template.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-black text-[#344E41] text-lg leading-tight truncate mr-2">
                      {template.name}
                    </h3>
                    {checkForDuplicate(template.name) && (
                      <div className="flex items-center flex-shrink-0 text-[#E9C46A] bg-[#E9C46A]/10 px-2 py-1 rounded-lg text-xs font-bold">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        <span>Added</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </span>
                    <div className="flex items-center text-[#E9C46A]">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-bold text-[#344E41] opacity-70 ml-1">
                        {template.popularity}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-[#344E41] opacity-70 font-medium text-sm mb-5 line-clamp-2 flex-grow">
                {template.description}
              </p>

              {/* Details */}
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#344E41] opacity-60 mb-5">
                <span>{template.frequency}</span>
                <span>{template.target} {template.unit}</span>
                <span>{template.category}</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {template.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-[#A3B18A]/20 text-[#344E41] font-bold rounded-lg text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleUseTemplate(template)}
                disabled={createHabitMutation.isPending}
                className={`w-full py-3.5 px-4 rounded-xl transition-all font-bold mt-auto ${
                  checkForDuplicate(template.name)
                    ? 'bg-[#E9C46A]/20 text-[#344E41] hover:bg-[#E9C46A]/40'
                    : 'bg-[#344E41] hover:bg-[#2a3f35] text-[#FEFAE0] shadow-md'
                }`}
              >
                {createHabitMutation.isPending 
                  ? 'Adding...' 
                  : checkForDuplicate(template.name)
                    ? 'Add Duplicate'
                    : 'Use This Template'
                }
              </button>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-16 bg-[#A3B18A]/5 rounded-3xl border border-[#A3B18A]/20">
            <div className="text-[#344E41] opacity-20 mb-4">
              <Filter className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-black text-[#344E41] mb-2">
              No templates found
            </h3>
            <p className="text-[#344E41] opacity-60 font-medium mb-6">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="px-6 py-3 bg-[#A3B18A]/20 text-[#344E41] font-bold rounded-xl hover:bg-[#A3B18A]/40 transition-colors"
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
