import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, User, X } from 'lucide-react';

interface ProfilePhotoPickerProps {
  currentPhoto?: string;
  currentIcon?: string;
  currentColor: string;
  onPhotoSelect: (photo: string | null) => void;
  onIconSelect: (icon: string) => void;
  onColorSelect: (color: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_ICONS = [
  '👤', '🧑', '👨', '👩', '🧔', '👱', '👴', '👵',
  '😀', '😊', '😎', '🤗', '🤔', '🙂', '😇', '🤓',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🦄', '🐸', '🐙', '🦋', '🌟', '⭐', '🔥', '💎',
  '🌈', '🌙', '☀️', '🌍', '🚀', '⚡', '💫', '🎯'
];

const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#374151'
];

const ProfilePhotoPicker: React.FC<ProfilePhotoPickerProps> = ({
  currentPhoto,
  currentIcon,
  currentColor,
  onPhotoSelect,
  onIconSelect,
  onColorSelect,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'icon' | 'color' | 'upload'>('icon');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5MB');
      return;
    }

    try {
      // Convert to base64 for demo purposes
      // In a real app, you'd upload to a server
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onPhotoSelect(result);
        setUploadError(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadError('Failed to upload image');
    }
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
          className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Choose Profile Picture
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Current Preview */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-semibold text-white"
                style={{ backgroundColor: currentColor }}
              >
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : currentIcon ? (
                  <span className="text-3xl">{currentIcon}</span>
                ) : (
                  <User className="h-8 w-8" />
                )}
              </div>
              {currentPhoto && (
                <button
                  onClick={() => onPhotoSelect(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['icon', 'color', 'upload'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {tab === 'icon' && 'Icons'}
                {tab === 'color' && 'Colors'}
                {tab === 'upload' && 'Upload'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-4">
            {activeTab === 'icon' && (
              <div className="grid grid-cols-8 gap-2">
                {DEFAULT_ICONS.map((icon, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onIconSelect(icon)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      currentIcon === icon
                        ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500'
                        : ''
                    }`}
                  >
                    {icon}
                  </motion.button>
                ))}
              </div>
            )}

            {activeTab === 'color' && (
              <div className="grid grid-cols-10 gap-2">
                {AVATAR_COLORS.map((color, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onColorSelect(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      currentColor === color
                        ? 'ring-2 ring-gray-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <span className="text-primary-600 hover:text-primary-500">
                          Upload a photo
                        </span>
                        <span> or drag and drop</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                
                {uploadError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {uploadError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfilePhotoPicker;