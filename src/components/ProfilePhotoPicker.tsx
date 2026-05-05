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
          className="bg-[#FEFAE0] rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-[#344E41] tracking-tight">
              Choose Profile Picture
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#344E41]/10 rounded-xl transition-colors"
            >
              <X className="h-6 w-6 text-[#344E41] opacity-50" />
            </button>
          </div>

          {/* Current Preview */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-md"
                style={{ backgroundColor: currentColor }}
              >
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : currentIcon ? (
                  <span className="text-4xl">{currentIcon}</span>
                ) : (
                  <User className="h-10 w-10" />
                )}
              </div>
              {currentPhoto && (
                <button
                  onClick={() => onPhotoSelect(null)}
                  className="absolute top-0 right-0 bg-red-400 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors shadow-md"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8 bg-[#A3B18A]/10 rounded-xl p-1.5">
            {(['icon', 'color', 'upload'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-[#FEFAE0] text-[#344E41] shadow-sm'
                    : 'text-[#344E41] opacity-60 hover:opacity-100 hover:bg-[#344E41]/5'
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
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl hover:bg-[#344E41]/5 transition-colors ${
                      currentIcon === icon
                        ? 'bg-[#E9C46A]/20 ring-2 ring-[#E9C46A] shadow-sm'
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
                        ? 'ring-4 ring-[#FEFAE0] shadow-[0_0_0_2px_#344E41]'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-[#344E41]/20 bg-[#A3B18A]/5 rounded-2xl p-8 text-center transition-colors hover:bg-[#A3B18A]/10">
                  <div className="flex flex-col items-center space-y-3">
                    <Upload className="h-8 w-8 text-[#344E41] opacity-40" />
                    <div className="text-sm font-bold text-[#344E41] opacity-70">
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <span className="text-[#E9C46A] hover:text-[#d4b05a] opacity-100">
                          Upload a photo
                        </span>
                        <span> or drag and drop</span>
                      </label>
                    </div>
                    <p className="text-xs font-medium text-[#344E41] opacity-50">
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
                  <p className="text-sm font-bold text-red-500">
                    {uploadError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-[#344E41]/10">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-[#344E41] bg-[#A3B18A]/20 hover:bg-[#A3B18A]/40 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-black bg-[#E9C46A] text-[#344E41] hover:bg-[#d4b05a] rounded-xl transition-colors shadow-md"
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