import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { HabitCategory, HabitFrequency } from '../types';

interface HabitFormData {
  name: string;
  notes?: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  target?: number;
  unit?: string;
  color?: string;
  icon?: string;
}

const HABIT_CATEGORIES = [
  { value: 'health' as HabitCategory, label: 'Health & Fitness', icon: '💪' },
  { value: 'sport' as HabitCategory, label: 'Sport', icon: '⚡' },
  { value: 'learning' as HabitCategory, label: 'Learning', icon: '📚' },
  { value: 'mindfulness' as HabitCategory, label: 'Mindfulness', icon: '🧘' },
  { value: 'social' as HabitCategory, label: 'Social', icon: '👥' },
  { value: 'productivity' as HabitCategory, label: 'Productivity', icon: '🎨' },
  { value: 'other' as HabitCategory, label: 'Other', icon: '📋' }
];

const HABIT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
  '#EC4899', '#6366F1', '#14B8A6', '#F87171'
];

const HABIT_ICONS = [
  '💪', '🏃', '📚', '💧', '🧘', '🍎', '💤', '✍️',
  '🎯', '🚫', '🎵', '🌱', '🔥', '⭐', '🎨', '💡'
];

const AddHabit: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<HabitFormData>({
    name: '',
    notes: '',
    category: 'health',
    frequency: 'daily',
    target: 1,
    unit: 'times',
    color: HABIT_COLORS[0],
    icon: HABIT_ICONS[0]
  });
  const [errors, setErrors] = useState<Partial<Record<keyof HabitFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof HabitFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Habit name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Habit name must be at least 3 characters';
    }

    if (formData.notes && formData.notes.length > 200) {
      newErrors.notes = 'Notes must be less than 200 characters';
    }

    if (formData.target && (formData.target < 1 || formData.target > 365)) {
      newErrors.target = 'Target must be between 1 and 365';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await api.habits.create(formData);
      
      navigate('/dashboard', { 
        state: { message: 'Habit created successfully!' }
      });
    } catch (error: any) {
      console.error('Error creating habit:', error);
      setErrors({ 
        name: error.response?.data?.error || 'Failed to create habit. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof HabitFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Add New Habit
            </h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Habit Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Habit Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.name 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                } text-gray-900 dark:text-gray-100`}
                placeholder="e.g., Drink 8 glasses of water"
                maxLength={50}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.notes 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                } text-gray-900 dark:text-gray-100 resize-none`}
                placeholder="Add notes to help you stay motivated..."
                maxLength={200}
              />
              <div className="flex justify-between mt-1">
                {errors.notes && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.notes}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                  {(formData.notes || '').length}/200
                </p>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {HABIT_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Frequency and Target */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency
                </label>
                <select
                  id="frequency"
                  value={formData.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label htmlFor="target" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target
                </label>
                <input
                  type="number"
                  id="target"
                  value={formData.target || 1}
                  onChange={(e) => handleInputChange('target', parseInt(e.target.value) || 1)}
                  min="1"
                  max="365"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.target 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  } text-gray-900 dark:text-gray-100`}
                />
                {errors.target && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.target}</p>
                )}
              </div>
            </div>

            {/* Unit */}
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unit (Optional)
              </label>
              <input
                type="text"
                id="unit"
                value={formData.unit || ''}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., times, minutes, pages"
                maxLength={20}
              />
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color Theme
              </label>
              <div className="flex flex-wrap gap-2">
                {HABIT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleInputChange('color', color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color 
                        ? 'border-gray-900 dark:border-gray-100 scale-110' 
                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {HABIT_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleInputChange('icon', icon)}
                    className={`w-10 h-10 text-xl border-2 rounded-lg transition-all ${
                      formData.icon === icon 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-110' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:scale-105'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h3>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: formData.color }}
                >
                  {formData.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {formData.name || 'Your habit name'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.frequency.charAt(0).toUpperCase() + formData.frequency.slice(1)} • 
                    Target: {formData.target || 1} {formData.unit || 'time'}{(formData.target || 1) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Habit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddHabit;
