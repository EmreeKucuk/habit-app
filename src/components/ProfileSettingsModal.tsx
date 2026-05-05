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
    publicProfile: user.publicProfile,
    privacyLevel: user.privacyLevel || (user.publicProfile ? 'public' : 'private')
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
    console.log('=== FORM SUBMIT DEBUG ===');
    console.log('Form data being submitted:', formData);
    console.log('Original user data:', user);
    
    if (validateForm()) {
      console.log('Form validation passed, calling onSave...');
      onSave(formData);
    } else {
      console.log('Form validation failed:', errors);
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
          className="bg-[#FEFAE0] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#344E41]/10">
            <h2 className="text-2xl font-black text-[#344E41] tracking-tight">
              Profile Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#344E41]/10 rounded-xl transition-colors"
            >
              <X className="h-6 w-6 text-[#344E41] opacity-50" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-[#344E41]">
                Profile Picture
              </h3>
              
              <div className="flex items-center space-x-5">
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-md"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {formData.profilePhoto ? (
                      <img
                        src={formData.profilePhoto}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : formData.avatarIcon ? (
                      <span className="text-4xl">{formData.avatarIcon}</span>
                    ) : (
                      <User className="h-8 w-8" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPhotoPicker(true)}
                    className="absolute bottom-0 right-0 bg-[#E9C46A] text-[#344E41] rounded-full p-2.5 hover:bg-[#d4b05a] transition-colors shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPhotoPicker(true)}
                    className="text-sm text-[#344E41] hover:text-[#E9C46A] font-black transition-colors"
                  >
                    Change picture
                  </button>
                  <p className="text-xs font-bold text-[#344E41] opacity-50 mt-1">
                    Choose an icon, color, or upload your own photo
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-[#344E41]">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Username */}
                <div>
                  <label className="flex items-center space-x-2 text-xs font-bold text-[#344E41] uppercase tracking-wider mb-2 ml-1">
                    <User className="h-3.5 w-3.5" />
                    <span>Username *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl bg-[#A3B18A]/10 text-[#344E41] font-medium focus:ring-2 focus:ring-[#E9C46A] placeholder-[#344E41]/30 transition-colors ${
                      errors.username ? 'border-2 border-red-400 bg-red-50 text-red-900' : 'border-none'
                    }`}
                    placeholder="Enter username"
                  />
                  {errors.username && (
                    <p className="mt-1.5 ml-1 text-xs font-semibold text-red-500">
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label className="flex items-center space-x-2 text-xs font-bold text-[#344E41] uppercase tracking-wider mb-2 ml-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Age</span>
                  </label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : undefined)}
                    className={`w-full px-4 py-3.5 rounded-xl bg-[#A3B18A]/10 text-[#344E41] font-medium focus:ring-2 focus:ring-[#E9C46A] placeholder-[#344E41]/30 transition-colors ${
                      errors.age ? 'border-2 border-red-400 bg-red-50 text-red-900' : 'border-none'
                    }`}
                    placeholder="Enter age"
                    min="13"
                    max="120"
                  />
                  {errors.age && (
                    <p className="mt-1.5 ml-1 text-xs font-semibold text-red-500">
                      {errors.age}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* First Name */}
                <div>
                  <label className="flex items-center space-x-2 text-xs font-bold text-[#344E41] uppercase tracking-wider mb-2 ml-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-3.5 border-none rounded-xl bg-[#A3B18A]/10 text-[#344E41] font-medium focus:ring-2 focus:ring-[#E9C46A] placeholder-[#344E41]/30 transition-colors"
                    placeholder="Enter first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="flex items-center space-x-2 text-xs font-bold text-[#344E41] uppercase tracking-wider mb-2 ml-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-4 py-3.5 border-none rounded-xl bg-[#A3B18A]/10 text-[#344E41] font-medium focus:ring-2 focus:ring-[#E9C46A] placeholder-[#344E41]/30 transition-colors"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {/* Email (readonly) */}
              <div>
                <label className="flex items-center space-x-2 text-xs font-bold text-[#344E41] uppercase tracking-wider mb-2 ml-1">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email</span>
                </label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full px-4 py-3.5 border-none rounded-xl bg-[#344E41]/5 text-[#344E41] opacity-60 font-medium cursor-not-allowed"
                />
                <p className="text-xs font-bold text-[#344E41] opacity-50 mt-1.5 ml-1">
                  Email cannot be changed from here
                </p>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-[#344E41]">
                About
              </h3>
              
              <div>
                <label className="flex items-center space-x-2 text-xs font-bold text-[#344E41] uppercase tracking-wider mb-2 ml-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Bio</span>
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3.5 rounded-xl bg-[#A3B18A]/10 text-[#344E41] font-medium focus:ring-2 focus:ring-[#E9C46A] placeholder-[#344E41]/30 transition-colors resize-none ${
                    errors.bio ? 'border-2 border-red-400 bg-red-50 text-red-900' : 'border-none'
                  }`}
                  placeholder="Tell others about yourself..."
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1.5 ml-1">
                  {errors.bio && (
                    <p className="text-xs font-semibold text-red-500">
                      {errors.bio}
                    </p>
                  )}
                  <p className="text-xs font-bold text-[#344E41] opacity-50 ml-auto">
                    {formData.bio?.length || 0}/500
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-[#344E41]">
                Privacy Settings
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-[#344E41] opacity-60 mb-3">
                    Choose who can see your profile and progress
                  </p>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-4 cursor-pointer p-3 rounded-xl hover:bg-[#344E41]/5 transition-colors">
                      <input
                        type="radio"
                        name="privacyLevel"
                        value="public"
                        checked={formData.privacyLevel === 'public'}
                        onChange={(e) => handleInputChange('privacyLevel', e.target.value)}
                        className="text-[#E9C46A] focus:ring-[#E9C46A] border-[#344E41]/20 w-4 h-4"
                      />
                      <Eye className="h-5 w-5 text-[#A3B18A]" />
                      <div>
                        <span className="text-sm font-black text-[#344E41]">
                          Public
                        </span>
                        <p className="text-xs font-bold text-[#344E41] opacity-50">
                          Everyone can see your profile and progress
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-4 cursor-pointer p-3 rounded-xl hover:bg-[#344E41]/5 transition-colors">
                      <input
                        type="radio"
                        name="privacyLevel"
                        value="friends"
                        checked={formData.privacyLevel === 'friends'}
                        onChange={(e) => handleInputChange('privacyLevel', e.target.value)}
                        className="text-[#E9C46A] focus:ring-[#E9C46A] border-[#344E41]/20 w-4 h-4"
                      />
                      <User className="h-5 w-5 text-[#E9C46A]" />
                      <div>
                        <span className="text-sm font-black text-[#344E41]">
                          Friends Only
                        </span>
                        <p className="text-xs font-bold text-[#344E41] opacity-50">
                          Only your friends can see your progress
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-4 cursor-pointer p-3 rounded-xl hover:bg-[#344E41]/5 transition-colors">
                      <input
                        type="radio"
                        name="privacyLevel"
                        value="private"
                        checked={formData.privacyLevel === 'private'}
                        onChange={(e) => handleInputChange('privacyLevel', e.target.value)}
                        className="text-[#E9C46A] focus:ring-[#E9C46A] border-[#344E41]/20 w-4 h-4"
                      />
                      <EyeOff className="h-5 w-5 text-[#344E41] opacity-50" />
                      <div>
                        <span className="text-sm font-black text-[#344E41]">
                          Private
                        </span>
                        <p className="text-xs font-bold text-[#344E41] opacity-50">
                          Keep your profile and progress private
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-[#344E41]/10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-bold text-[#344E41] bg-[#A3B18A]/20 hover:bg-[#A3B18A]/40 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-3 text-sm font-black bg-[#E9C46A] text-[#344E41] hover:bg-[#d4b05a] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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