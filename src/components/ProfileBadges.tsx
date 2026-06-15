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
        <div className="h-6 bg-[#344E41] dark:bg-gray-700/10 rounded-lg w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-5 bg-[#A3B18A] dark:bg-gray-800/5 rounded-3xl animate-pulse">
              <div className="w-10 h-10 bg-[#344E41] dark:bg-gray-700/10 rounded-xl mx-auto mb-3"></div>
              <div className="h-4 bg-[#344E41] dark:bg-gray-700/10 rounded mb-2"></div>
              <div className="h-2 bg-[#344E41] dark:bg-gray-700/10 rounded w-2/3 mx-auto"></div>
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
          <div className="flex items-center gap-2 mb-5">
            <Award className="w-6 h-6 text-[#E9C46A]" />
            <h3 className="text-lg font-black text-[#344E41] dark:text-gray-100">
              Earned Badges ({earnedBadges.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {earnedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="p-5 bg-[#E9C46A] dark:bg-yellow-600/10 border border-[#E9C46A]/40 rounded-3xl text-center hover:shadow-[0_8px_30px_rgb(52,78,65,0.08)] transition-all duration-300 hover:scale-105 shadow-[0_4px_20px_rgb(52,78,65,0.03)] h-full flex flex-col justify-between">
                  <div>
                    <div className="text-4xl mb-3 drop-shadow-sm">{badge.icon}</div>
                    <h4 className="font-black text-[#344E41] dark:text-gray-100 text-sm mb-2">
                      {badge.name}
                    </h4>
                    <p className="text-xs text-[#344E41] dark:text-gray-100 font-medium opacity-80 leading-tight">
                      {badge.description}
                    </p>
                  </div>
                  {badge.earnedAt && (
                    <p className="text-xs text-[#344E41] dark:text-gray-100 mt-3 font-bold bg-[#E9C46A] dark:bg-yellow-600/20 px-2 py-1.5 rounded-xl uppercase tracking-wider">
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
        <div className="pt-6 border-t border-[#344E41] dark:border-gray-700/10 mt-8">
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-5 h-5 text-[#344E41] dark:text-gray-100 opacity-50" />
            <h3 className="text-lg font-black text-[#344E41] dark:text-gray-100">
              Locked Badges ({lockedBadges.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {lockedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (earnedBadges.length + index) * 0.05 }}
                className="group relative"
              >
                <div className="p-5 bg-[#A3B18A] dark:bg-gray-800/5 border border-[#344E41] dark:border-gray-700/10 rounded-3xl text-center opacity-60 hover:opacity-100 transition-all duration-300 h-full flex flex-col justify-between">
                  <div>
                    <div className="text-3xl mb-3 grayscale opacity-70">{badge.icon}</div>
                    <h4 className="font-bold text-[#344E41] dark:text-gray-100 opacity-80 text-sm mb-2">
                      {badge.name}
                    </h4>
                    <p className="text-xs text-[#344E41] dark:text-gray-100 opacity-60 font-medium leading-tight">
                      {badge.description}
                    </p>
                  </div>
                  <Lock className="w-4 h-4 text-[#344E41] dark:text-gray-100 opacity-40 mx-auto mt-4" />
                </div>
              </motion.div>
            ))}
          </div>
          {lockedBadges.length > 8 && (
            <p className="text-xs font-bold text-[#344E41] dark:text-gray-100 opacity-50 text-center mt-6">
              And {lockedBadges.length - 8} more badges to unlock...
            </p>
          )}
        </div>
      )}

      {/* No badges yet */}
      {badges.length === 0 && (
        <div className="text-center py-12 bg-[#A3B18A] dark:bg-gray-800/5 rounded-3xl border border-[#344E41] dark:border-gray-700/5">
          <Award className="w-16 h-16 text-[#344E41] dark:text-gray-100 opacity-20 mx-auto mb-4" />
          <h3 className="text-xl font-black text-[#344E41] dark:text-gray-100 mb-2">
            No badges yet
          </h3>
          <p className="text-[#344E41] dark:text-gray-100 font-medium opacity-70 text-sm">
            Complete habits to start earning badges!
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileBadges;