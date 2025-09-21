import React from 'react';
import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';
import { Badge } from '../types';

interface ProfileBadgesProps {
  badges: Badge[];
  isLoading?: boolean;
}

const ProfileBadges: React.FC<ProfileBadgesProps> = ({ badges, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded mx-auto mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const earnedBadges = badges.filter(badge => badge.earned);
  const lockedBadges = badges.filter(badge => !badge.earned);

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Earned Badges ({earnedBadges.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {earnedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-center hover:shadow-md transition-all duration-200 hover:scale-105">
                  <div className="text-2xl mb-2">{badge.icon}</div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">
                    {badge.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                    {badge.description}
                  </p>
                  {badge.earnedAt && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 font-medium">
                      Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Locked Badges ({lockedBadges.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {lockedBadges.slice(0, 8).map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (earnedBadges.length + index) * 0.1 }}
                className="group relative"
              >
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center opacity-60 hover:opacity-80 transition-opacity">
                  <div className="text-2xl mb-2 grayscale">{badge.icon}</div>
                  <h4 className="font-medium text-gray-600 dark:text-gray-400 text-sm mb-1">
                    {badge.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-500 leading-tight">
                    {badge.description}
                  </p>
                  <Lock className="w-3 h-3 text-gray-400 mx-auto mt-2" />
                </div>
              </motion.div>
            ))}
          </div>
          {lockedBadges.length > 8 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3">
              And {lockedBadges.length - 8} more badges to unlock...
            </p>
          )}
        </div>
      )}

      {/* No badges yet */}
      {badges.length === 0 && (
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
            No badges yet
          </h3>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            Complete habits to start earning badges!
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileBadges;