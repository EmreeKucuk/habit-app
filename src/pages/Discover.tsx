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
        return <Eye className="w-4 h-4 text-green-500" />;
      case 'friends':
        return <Users className="w-4 h-4 text-yellow-500" />;
      case 'private':
        return <Lock className="w-4 h-4 text-red-500" />;
      default:
        return <EyeOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFriendStatusButton = (user: any) => {
    const friendStatus = user.friendStatus || 'none';
    switch (friendStatus) {
      case 'friends':
        return (
          <button className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
            Friends
          </button>
        );
      case 'pending':
        return (
          <button className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm font-medium">
            Pending
          </button>
        );
      case 'received':
        return (
          <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
            Respond
          </button>
        );
      default:
        return (
          <button
            onClick={() => handleAddFriend(user.id)}
            disabled={friendRequestMutation.isPending}
            className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg text-sm font-medium hover:bg-primary-200 dark:hover:bg-primary-900/30 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-3 h-3" />
            <span>{friendRequestMutation.isPending ? 'Sending...' : 'Add Friend'}</span>
          </button>
        );
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Discover People</h1>
              <p className="text-gray-600 dark:text-gray-400">Connect with other habit builders</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{isLoading ? 'Loading...' : `${users.length} users found`}</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative lg:flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by username or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="input-field lg:w-48"
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
              className="input-field lg:w-48"
            >
              <option value="all">All Users</option>
              <option value="public">Public Only</option>
              <option value="active">Recently Active</option>
            </select>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">Privacy Levels</h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <div className="flex items-center space-x-2">
                  <Eye className="w-3 h-3 text-green-500" />
                  <span><strong>Public:</strong> Visible to everyone, can be added as friend</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-3 h-3 text-yellow-500" />
                  <span><strong>Friends:</strong> Only visible to friends or exact username search</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="w-3 h-3 text-red-500" />
                  <span><strong>Private:</strong> Only visible via exact username search</span>
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
            <div key={user.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* User Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={generateAvatar(user.username, user.avatarColor)}
                    alt={user.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getPrivacyIcon(user.privacyLevel)}
                  {getFriendStatusButton(user)}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{user.level}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">Level</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{user.xp}</div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">XP</div>
                </div>
                <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{user.highestStreak}</div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">Streak</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Success Rate:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{user.successPercentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Habits:</span>
                  <span className="font-medium">{user.totalHabits || 0}</span>
                </div>
                {(user as any).mutualFriends && (user as any).mutualFriends > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Mutual Friends:</span>
                    <span className="font-medium text-primary-600 dark:text-primary-400">{(user as any).mutualFriends}</span>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              {(user as any).recentActivity && user.privacyLevel === 'public' && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{(user as any).recentActivity}</p>
                </div>
              )}
            </div>
          ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No users found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
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
