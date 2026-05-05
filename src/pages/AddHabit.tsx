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
        <div className="bg-[#FEFAE0] rounded-3xl p-8 md:p-10 border border-[#344E41]/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-black text-[#344E41] tracking-tight">
              Add New Habit
            </h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-[#344E41] opacity-50 hover:opacity-100 transition-opacity p-2 bg-[#344E41]/5 rounded-xl hover:bg-[#344E41]/10"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Habit Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-[#344E41] uppercase tracking-wider mb-2 ml-1">
                Habit Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9C46A] transition-colors font-medium placeholder-[#344E41]/30 ${
                  errors.name 
                    ? 'border-2 border-red-400 bg-red-50 text-red-900' 
                    : 'border-none bg-[#A3B18A]/10 text-[#344E41]'
                }`}
                placeholder="e.g., Drink 8 glasses of water"
                maxLength={50}
              />
              {errors.name && (
                <p className="mt-1.5 ml-1 text-xs font-semibold text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-xs font-bold text-[#344E41] uppercase tracking-wider mb-2 ml-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className={`w-full px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9C46A] transition-colors font-medium placeholder-[#344E41]/30 resize-none ${
                  errors.notes 
                    ? 'border-2 border-red-400 bg-red-50 text-red-900' 
                    : 'border-none bg-[#A3B18A]/10 text-[#344E41]'
                }`}
                placeholder="Add notes to help you stay motivated..."
                maxLength={200}
              />
              <div className="flex justify-between mt-1.5 ml-1">
                {errors.notes && (
                  <p className="text-xs font-semibold text-red-500">{errors.notes}</p>
                )}
                <p className="text-xs font-semibold text-[#344E41] opacity-50 ml-auto">
                  {(formData.notes || '').length}/200
                </p>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-xs font-bold text-[#344E41] uppercase tracking-wider mb-2 ml-1">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3.5 border-none bg-[#A3B18A]/10 text-[#344E41] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9C46A] transition-colors font-bold appearance-none"
              >
                {HABIT_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value} className="bg-[#FEFAE0]">
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Frequency and Target */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="frequency" className="block text-xs font-bold text-[#344E41] uppercase tracking-wider mb-2 ml-1">
                  Frequency
                </label>
                <select
                  id="frequency"
                  value={formData.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  className="w-full px-4 py-3.5 border-none bg-[#A3B18A]/10 text-[#344E41] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9C46A] transition-colors font-bold appearance-none"
                >
                  <option value="daily" className="bg-[#FEFAE0]">Daily</option>
                  <option value="weekly" className="bg-[#FEFAE0]">Weekly</option>
                  <option value="monthly" className="bg-[#FEFAE0]">Monthly</option>
                </select>
              </div>

              <div>
                <label htmlFor="target" className="block text-xs font-bold text-[#344E41] uppercase tracking-wider mb-2 ml-1">
                  Target
                </label>
                <input
                  type="number"
                  id="target"
                  value={formData.target || 1}
                  onChange={(e) => handleInputChange('target', parseInt(e.target.value) || 1)}
                  min="1"
                  max="365"
                  className={`w-full px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9C46A] transition-colors font-bold ${
                    errors.target 
                      ? 'border-2 border-red-400 bg-red-50 text-red-900' 
                      : 'border-none bg-[#A3B18A]/10 text-[#344E41]'
                  }`}
                />
                {errors.target && (
                  <p className="mt-1.5 ml-1 text-xs font-semibold text-red-500">{errors.target}</p>
                )}
              </div>
            </div>

            {/* Unit */}
            <div>
              <label htmlFor="unit" className="block text-xs font-bold text-[#344E41] uppercase tracking-wider mb-2 ml-1">
                Unit (Optional)
              </label>
              <input
                type="text"
                id="unit"
                value={formData.unit || ''}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="w-full px-4 py-3.5 border-none bg-[#A3B18A]/10 text-[#344E41] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9C46A] transition-colors font-medium placeholder-[#344E41]/30"
                placeholder="e.g., times, minutes, pages"
                maxLength={20}
              />
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-xs font-bold text-[#344E41] uppercase tracking-wider mb-3 ml-1">
                Color Theme
              </label>
              <div className="flex flex-wrap gap-3 pl-1">
                {HABIT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleInputChange('color', color)}
                    className={`w-10 h-10 rounded-full border-4 transition-all ${
                      formData.color === color 
                        ? 'border-[#FEFAE0] ring-2 ring-[#344E41] scale-110 shadow-md' 
                        : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-xs font-bold text-[#344E41] uppercase tracking-wider mb-3 ml-1">
                Icon
              </label>
              <div className="flex flex-wrap gap-3 pl-1">
                {HABIT_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleInputChange('icon', icon)}
                    className={`w-12 h-12 text-2xl rounded-2xl transition-all flex items-center justify-center ${
                      formData.icon === icon 
                        ? 'bg-[#E9C46A] shadow-md scale-110 border-none' 
                        : 'bg-[#A3B18A]/10 text-gray-400 hover:bg-[#A3B18A]/30 hover:scale-105 border-none opacity-80 hover:opacity-100'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-[#A3B18A]/10 p-6 rounded-2xl mt-4 border border-[#A3B18A]/20">
              <h3 className="text-xs font-bold text-[#344E41] uppercase tracking-wider mb-4">Preview</h3>
              <div className="flex items-center space-x-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-sm"
                  style={{ backgroundColor: formData.color }}
                >
                  {formData.icon}
                </div>
                <div>
                  <h4 className="font-bold text-[#344E41] text-lg leading-tight">
                    {formData.name || 'Your habit name'}
                  </h4>
                  <p className="text-sm font-semibold text-[#344E41] opacity-60 mt-1">
                    {formData.frequency.charAt(0).toUpperCase() + formData.frequency.slice(1)} • 
                    Target: {formData.target || 1} {formData.unit || 'time'}{(formData.target || 1) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-1/3 px-4 py-4 bg-[#A3B18A]/20 text-[#344E41] font-bold rounded-xl hover:bg-[#A3B18A]/40 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 px-4 py-4 bg-[#344E41] text-[#FEFAE0] font-bold rounded-xl hover:bg-[#2a3f35] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-[#FEFAE0]/30 border-t-[#FEFAE0] rounded-full animate-spin"></div>
                ) : (
                  'Create Habit'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddHabit;
