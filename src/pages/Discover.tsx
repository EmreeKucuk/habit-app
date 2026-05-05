import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users, UserPlus, Eye, EyeOff, Lock } from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { usersApi, friendsApi } from '../services/api';
import { User } from '../types';

const Discover: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'xp' | 'level' | 'streak' | 'recent'>('xp');
  const [filterBy, setFilterBy] = useState<'all' | 'public' | 'active'>('all');

  // Fetch users from API
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['discover-users', searchTerm, sortBy, filterBy],
    queryFn: () => usersApi.getDiscoverUsers({
      search: searchTerm.trim() || undefined,
      sortBy,
      filterBy
    }),
    staleTime: 30000, // 30 seconds
  });

  // Friend request mutation
  const friendRequestMutation = useMutation({
    mutationFn: (userId: string) => friendsApi.sendRequest({ userId }),
    onSuccess: (data, userId) => {
      // Optimistically update the user's friend status
      queryClient.setQueryData(['discover-users', searchTerm, sortBy, filterBy], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map(user => 
          user.id === userId 
            ? { ...user, friendStatus: 'pending' }
            : user
        );
      });
      console.log('Friend request sent successfully:', data.message);
    },
    onError: (error: any) => {
      console.error('Failed to send friend request:', error);
      // You could add a toast notification here
    },
  });

  const generateAvatar = (username: string, color: string) => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E${username.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

  const handleAddFriend = (userId: string) => {
    friendRequestMutation.mutate(userId);
  };

  const getPrivacyIcon = (privacyLevel?: string) => {
    switch (privacyLevel) {
      case 'public':
        return <Eye className="w-5 h-5 text-[#A3B18A]" />;
      case 'friends':
        return <Users className="w-5 h-5 text-[#E9C46A]" />;
      case 'private':
        return <Lock className="w-5 h-5 text-[#344E41] opacity-50" />;
      default:
        return <EyeOff className="w-5 h-5 text-[#344E41] opacity-30" />;
    }
  };

  const getFriendStatusButton = (user: any) => {
    const friendStatus = user.friendStatus || 'none';
    switch (friendStatus) {
      case 'friends':
        return (
          <button className="px-4 py-2 bg-[#A3B18A]/20 text-[#344E41] rounded-xl text-sm font-bold border border-[#A3B18A]/30">
            Friends
          </button>
        );
      case 'pending':
        return (
          <button className="px-4 py-2 bg-[#E9C46A]/20 text-[#344E41] rounded-xl text-sm font-bold border border-[#E9C46A]/30">
            Pending
          </button>
        );
      case 'received':
        return (
          <button className="px-4 py-2 bg-[#344E41]/10 text-[#344E41] rounded-xl text-sm font-bold border border-[#344E41]/20">
            Respond
          </button>
        );
      default:
        return (
          <button
            onClick={() => handleAddFriend(user.id)}
            disabled={friendRequestMutation.isPending}
            className="px-4 py-2 bg-[#344E41] text-[#FEFAE0] rounded-xl text-sm font-bold hover:bg-[#2a3f35] transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>{friendRequestMutation.isPending ? 'Sending...' : 'Add Friend'}</span>
          </button>
        );
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-[#A3B18A]/10 border border-[#A3B18A]/20 rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-black text-[#344E41] tracking-tight mb-2">Discover People</h1>
              <p className="text-[#344E41] opacity-70 font-medium">Connect with other habit builders</p>
            </div>
            <div className="flex items-center space-x-2 text-sm font-bold text-[#344E41] opacity-70 bg-[#FEFAE0] px-4 py-2 rounded-xl border border-[#344E41]/5">
              <Users className="w-5 h-5" />
              <span>{isLoading ? 'Loading...' : `${users.length} users found`}</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative lg:flex-1 lg:max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#344E41] opacity-40" />
              <input
                type="text"
                placeholder="Search by username or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-none rounded-xl bg-[#FEFAE0] text-[#344E41] font-medium focus:ring-2 focus:ring-[#E9C46A] placeholder-[#344E41]/30 transition-shadow shadow-sm"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-3.5 border-none rounded-xl bg-[#FEFAE0] text-[#344E41] font-bold focus:ring-2 focus:ring-[#E9C46A] transition-shadow shadow-sm appearance-none lg:w-48"
            >
              <option value="xp">Sort by XP</option>
              <option value="level">Sort by Level</option>
              <option value="streak">Sort by Streak</option>
              <option value="recent">Sort by Activity</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
              className="px-4 py-3.5 border-none rounded-xl bg-[#FEFAE0] text-[#344E41] font-bold focus:ring-2 focus:ring-[#E9C46A] transition-shadow shadow-sm appearance-none lg:w-48"
            >
              <option value="all">All Users</option>
              <option value="public">Public Only</option>
              <option value="active">Recently Active</option>
            </select>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-[#A3B18A]/5 border border-[#A3B18A]/20 rounded-2xl p-5">
          <div className="flex items-start space-x-3">
            <Eye className="w-6 h-6 text-[#A3B18A] mt-0.5" />
            <div>
              <h3 className="text-sm font-black text-[#344E41] uppercase tracking-wider">Privacy Levels</h3>
              <div className="mt-2 text-sm text-[#344E41] opacity-80 font-medium space-y-2">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-[#A3B18A]" />
                  <span><strong className="font-bold">Public:</strong> Visible to everyone, can be added as friend</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#E9C46A]" />
                  <span><strong className="font-bold">Friends:</strong> Only visible to friends or exact username search</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-[#344E41] opacity-50" />
                  <span><strong className="font-bold">Private:</strong> Only visible via exact username search</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400 mb-2">Failed to load users</div>
            <p className="text-gray-600 dark:text-gray-400">Please try again later</p>
          </div>
        )}

        {/* Users Grid */}
        {!isLoading && !error && (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
            <div key={user.id} className="bg-[#FEFAE0] rounded-3xl shadow-[0_4px_20px_rgb(52,78,65,0.05)] border border-[#344E41]/5 p-6 flex flex-col h-full hover:shadow-[0_8px_30px_rgb(52,78,65,0.08)] transition-all">
              {/* User Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={generateAvatar(user.username, user.avatarColor)}
                    alt={user.username}
                    className="w-14 h-14 rounded-2xl shadow-sm"
                  />
                  <div>
                    <h3 className="font-black text-[#344E41] text-lg leading-tight">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                    </h3>
                    <p className="text-sm font-bold text-[#344E41] opacity-50">@{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getPrivacyIcon(user.privacyLevel)}
                  {getFriendStatusButton(user)}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 bg-[#A3B18A]/10 rounded-xl border border-[#A3B18A]/20">
                  <div className="text-xl font-black text-[#344E41]">{user.level}</div>
                  <div className="text-xs font-bold text-[#344E41] opacity-60 uppercase tracking-wider">Level</div>
                </div>
                <div className="text-center p-3 bg-[#E9C46A]/10 rounded-xl border border-[#E9C46A]/20">
                  <div className="text-xl font-black text-[#344E41]">{user.xp}</div>
                  <div className="text-xs font-bold text-[#344E41] opacity-60 uppercase tracking-wider">XP</div>
                </div>
                <div className="text-center p-3 bg-[#344E41]/5 rounded-xl border border-[#344E41]/10">
                  <div className="text-xl font-black text-[#344E41]">{user.highestStreak}</div>
                  <div className="text-xs font-bold text-[#344E41] opacity-60 uppercase tracking-wider">Streak</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-3 text-sm text-[#344E41] opacity-70 font-medium mb-4 flex-grow">
                <div className="flex items-center justify-between">
                  <span>Success Rate:</span>
                  <span className="font-black text-[#A3B18A] text-base">{user.successPercentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Habits:</span>
                  <span className="font-bold text-[#344E41]">{user.totalHabits || 0}</span>
                </div>
                {(user as any).mutualFriends && (user as any).mutualFriends > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Mutual Friends:</span>
                    <span className="font-black text-[#E9C46A]">{(user as any).mutualFriends}</span>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              {(user as any).recentActivity && user.privacyLevel === 'public' && (
                <div className="mt-auto pt-4 border-t border-[#344E41]/10">
                  <p className="text-xs font-bold text-[#344E41] opacity-50">{(user as any).recentActivity}</p>
                </div>
              )}
            </div>
          ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && users.length === 0 && (
          <div className="text-center py-16 bg-[#A3B18A]/5 rounded-3xl border border-[#A3B18A]/20">
            <Users className="w-16 h-16 text-[#344E41] opacity-20 mx-auto mb-4" />
            <h3 className="text-xl font-black text-[#344E41] mb-2">
              No users found
            </h3>
            <p className="text-[#344E41] opacity-60 font-medium mb-6">
              {searchTerm ? 
                `No users match "${searchTerm}". Try a different search term.` :
                'Try adjusting your filters or search for specific users.'
              }
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Discover;
