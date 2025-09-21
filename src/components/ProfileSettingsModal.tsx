import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Calendar, FileText, Eye, EyeOff, Camera } from 'lucide-react';
import { User as UserType, ProfileUpdateRequest } from '../types';
import ProfilePhotoPicker from './ProfilePhotoPicker';

interface ProfileSettingsModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: ProfileUpdateRequest) => void;
  isLoading?: boolean;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ProfileUpdateRequest>({
    username: user.username,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    age: user.age || undefined,
    bio: user.bio || '',
    avatarIcon: user.avatarIcon || '',
    profilePhoto: user.profilePhoto || '',
    shareProgress: user.shareProgress,
    publicProfile: user.publicProfile
  });

  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const handleInputChange = (field: keyof ProfileUpdateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.username?.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (formData.age && (formData.age < 13 || formData.age > 120)) {
      newErrors.age = 'Age must be between 13 and 120';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handlePhotoSelect = (photo: string | null) => {
    handleInputChange('profilePhoto', photo);
  };

  const handleIconSelect = (icon: string) => {
    handleInputChange('avatarIcon', icon);
  };

  const handleColorSelect = (_color: string) => {
    // Note: avatarColor would need to be added to ProfileUpdateRequest type
    // For now, we'll handle this in the parent component
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Profile Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Profile Picture
              </h3>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-semibold text-white"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {formData.profilePhoto ? (
                      <img
                        src={formData.profilePhoto}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : formData.avatarIcon ? (
                      <span className="text-2xl">{formData.avatarIcon}</span>
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPhotoPicker(true)}
                    className="absolute -bottom-1 -right-1 bg-primary-600 text-white rounded-full p-2 hover:bg-primary-700 transition-colors"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPhotoPicker(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Change picture
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Choose an icon, color, or upload your own photo
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <User className="h-4 w-4" />
                    <span>Username *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter username"
                  />
                  {errors.username && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Age</span>
                  </label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : undefined)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.age ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter age"
                    min="13"
                    max="120"
                  />
                  {errors.age && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.age}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {/* Email (readonly) */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Email cannot be changed from here
                </p>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                About
              </h3>
              
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FileText className="h-4 w-4" />
                  <span>Bio</span>
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                    errors.bio ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Tell others about yourself..."
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.bio && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.bio}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                    {formData.bio?.length || 0}/500
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Privacy Settings
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Public Profile
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Allow others to view your profile
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.publicProfile}
                    onChange={(e) => handleInputChange('publicProfile', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <EyeOff className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Share Progress
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Allow friends to see your habit progress
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.shareProgress}
                    onChange={(e) => handleInputChange('shareProgress', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* Profile Photo Picker */}
      <ProfilePhotoPicker
        currentPhoto={formData.profilePhoto}
        currentIcon={formData.avatarIcon}
        currentColor={user.avatarColor}
        onPhotoSelect={handlePhotoSelect}
        onIconSelect={handleIconSelect}
        onColorSelect={handleColorSelect}
        isOpen={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
      />
    </AnimatePresence>
  );
};

export default ProfileSettingsModal;