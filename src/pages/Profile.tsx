import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Edit3, Camera } from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ProfilePhotoPicker from '../components/ProfilePhotoPicker';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import ProfileStatistics from '../components/ProfileStatistics';
import ProfileBadges from '../components/ProfileBadges';
import CategoryActivityChart from '../components/CategoryActivityChart';
import MotivationalQuoteComponent from '../components/MotivationalQuote';
import HighestStreakCard from '../components/HighestStreakCard';
import FriendsCard from '../components/FriendsCard';
import { usersApi, habitsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User, ProfileUpdateRequest } from '../types';
import { calculateEarnedBadges, AVAILABLE_BADGES } from '../utils/badges';

const Profile: React.FC = () => {
  const { user: authUser, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Mutation for updating profile photo
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { avatarIcon?: string; profilePhoto?: string; avatarColor?: string }) => {
      console.log('=== PHOTO UPDATE DEBUG ===');
      console.log('Photo update data:', data);
      
      const result = await usersApi.updateProfile(data);
      console.log('Photo update result:', result);
      return result;
    },
    onSuccess: (updatedUser) => {
      console.log('=== PHOTO UPDATE SUCCESS ===');
      console.log('Updated user from server:', updatedUser);
      
      // Update auth context user first
      updateUser(updatedUser);
      
      // Update the cached profile data
      queryClient.setQueryData(['profile', authUser?.id], updatedUser);
      
      // Invalidate and refetch profile data to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['profile', authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Force a refetch to ensure the UI updates
      queryClient.refetchQueries({ queryKey: ['profile', authUser?.id] });
      
      setShowPhotoPicker(false);
    },
    onError: (error: any) => {
      console.error('=== PHOTO UPDATE ERROR ===');
      console.error('Failed to update profile photo:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  });

  // Mutation for updating profile settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: ProfileUpdateRequest) => {
      console.log('=== PROFILE UPDATE DEBUG ===');
      console.log('Raw form data received:', data);
      console.log('Current user before update:', currentUser);
      
      const result = await usersApi.updateProfile(data);
      console.log('API response:', result);
      return result;
    },
    onSuccess: (updatedUser) => {
      console.log('=== UPDATE SUCCESS ===');
      console.log('Updated user from server:', updatedUser);
      
      // Update auth context user first
      updateUser(updatedUser);
      console.log('Auth context updated');
      
      // Update the cached profile data
      queryClient.setQueryData(['profile', authUser?.id], updatedUser);
      console.log('Query cache updated');
      
      // Invalidate and refetch profile data to ensure persistence
      queryClient.invalidateQueries({ queryKey: ['profile', authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Force a refetch to ensure the UI updates
      queryClient.refetchQueries({ queryKey: ['profile', authUser?.id] });
      console.log('Queries invalidated and refetched');
      
      setShowSettingsModal(false);
    },
    onError: (error: any) => {
      console.error('=== UPDATE ERROR ===');
      console.error('Failed to update settings:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  });

  // Fetch user profile data
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<User>({
    queryKey: ['profile', authUser?.id],
    queryFn: () => usersApi.getMyProfile(),
    enabled: !!authUser?.id,
    staleTime: 0, // Always refetch to get the latest data
    refetchOnWindowFocus: true,
  });

  // Use the most recent data available (prioritize profile query, fallback to auth user)
  const currentUser = profile || authUser;

  // Fetch user statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['profile-stats', authUser?.id],
    queryFn: () => usersApi.getStats(),
    enabled: !!authUser?.id,
  });

  // Fetch user habits for badge calculation
  const { data: habits, isLoading: habitsLoading } = useQuery({
    queryKey: ['habits', authUser?.id],
    queryFn: () => habitsApi.getAll(),
    enabled: !!authUser?.id,
  });

  // Calculate badges
  const badges = React.useMemo(() => {
    if (!currentUser || !habits?.habits) return [];
    const earnedBadges = calculateEarnedBadges(currentUser, habits.habits);
    
    // Create a complete list with earned status
    const allBadges = AVAILABLE_BADGES.map((availableBadge) => {
      const earnedBadge = earnedBadges.find(earned => earned.id === availableBadge.id);
      return {
        ...availableBadge,
        earned: !!earnedBadge,
        earnedAt: earnedBadge?.earnedAt
      };
    });
    
    return allBadges;
  }, [currentUser, habits]);

  if (profileLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (profileError || !currentUser) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400">Failed to load profile</p>
          <p className="text-sm text-gray-500 mt-2">Error: {profileError?.message || 'Unknown error'}</p>
        </div>
      </Layout>
    );
  }

  const getDisplayName = () => {
    if (currentUser.firstName || currentUser.lastName) {
      return `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
    }
    return currentUser.username;
  };

  const getProfileImageDisplay = () => {
    if (currentUser.profilePhoto) {
      return (
        <img
          src={currentUser.profilePhoto}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover"
        />
      );
    }
    
    if (currentUser.avatarIcon) {
      return (
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center text-3xl"
          style={{ backgroundColor: currentUser.avatarColor }}
        >
          {currentUser.avatarIcon}
        </div>
      );
    }
    
    return (
      <div 
        className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
        style={{ backgroundColor: currentUser.avatarColor }}
      >
        {currentUser.username.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <Layout>
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 max-w-4xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Photo/Avatar Section */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                {getProfileImageDisplay()}
                <button 
                  onClick={() => setShowPhotoPicker(true)}
                  className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <button 
                  onClick={() => setShowPhotoPicker(true)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Edit3 className="w-3 h-3" />
                  Change Photo
                </button>
              </div>
            </div>

            {/* User Information */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {getDisplayName()}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">@{currentUser.username}</p>
              {currentUser.age && (
                <p className="text-gray-600 dark:text-gray-400 mb-2">Age: {currentUser.age}</p>
              )}
              {currentUser.bio && (
                <p className="text-gray-700 dark:text-gray-300 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {currentUser.bio}
                </p>
              )}
              
              {/* User Level and XP */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Level</span>
                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-bold">
                      {currentUser.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">XP</span>
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-bold">
                      {currentUser.xp}
                    </span>
                  </div>
                </div>
                
                {/* XP Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress to Level {currentUser.level + 1}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {currentUser.xp % 100} / 100 XP
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full flex items-center justify-end pr-1"
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentUser.xp % 100)}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    >
                      {(currentUser.xp % 100) > 20 && (
                        <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                      )}
                    </motion.div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {100 - (currentUser.xp % 100)} XP needed for next level
                  </p>
                </div>
                
                {/* Featured Badges */}
                {badges.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Badges</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {badges.filter(b => b.earned).length} earned
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {badges
                        .filter(badge => badge.earned)
                        .slice(-3)
                        .reverse()
                        .map((badge, index) => (
                          <motion.div
                            key={badge.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 border border-yellow-300 dark:border-yellow-600 rounded-lg flex items-center justify-center text-lg hover:scale-105 transition-transform cursor-pointer">
                              {badge.icon}
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {badge.name}
                            </div>
                          </motion.div>
                        ))}
                      {badges.filter(b => b.earned).length === 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                          Complete habits to earn badges!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Components */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Statistics - Takes full left column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              📊 Statistics
            </h3>
            <ProfileStatistics stats={stats} isLoading={statsLoading} />
          </motion.div>

          {/* Right column with quote and streak cards */}
          <div className="flex flex-col gap-6 h-full">
            {/* Motivational Quote - Top right */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex-1"
            >
              <MotivationalQuoteComponent />
            </motion.div>

            {/* Highest Streak Habit - Bottom right */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex-1"
            >
              <div className="h-full">
                <HighestStreakCard habits={habits?.habits || []} isLoading={habitsLoading} />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Category Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📈 Category Activity
          </h3>
          <CategoryActivityChart 
            categoryBreakdown={stats?.categoryBreakdown || {}} 
            isLoading={statsLoading}
          />
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🏆 Badges & Achievements
          </h3>
          <ProfileBadges badges={badges} isLoading={habitsLoading || profileLoading} />
        </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-80 space-y-6">
          <FriendsCard />
        </div>
      </div>

      {/* Photo Picker Modal */}
      {showPhotoPicker && (
        <ProfilePhotoPicker
          currentPhoto={currentUser.profilePhoto}
          currentIcon={currentUser.avatarIcon}
          currentColor={currentUser.avatarColor}
          onPhotoSelect={(photo) => {
            updateProfileMutation.mutate({ profilePhoto: photo || undefined, avatarIcon: undefined });
          }}
          onIconSelect={(icon) => {
            updateProfileMutation.mutate({ avatarIcon: icon, profilePhoto: undefined });
          }}
          onColorSelect={(color) => {
            updateProfileMutation.mutate({ avatarColor: color });
          }}
          isOpen={showPhotoPicker}
          onClose={() => setShowPhotoPicker(false)}
        />
      )}

      {/* Settings Modal */}
      <ProfileSettingsModal
        user={currentUser}
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={(updates) => updateSettingsMutation.mutate(updates)}
        isLoading={updateSettingsMutation.isPending}
      />
    </Layout>
  );
};

export default Profile;
