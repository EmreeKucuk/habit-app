import React, { useState } from 'react';
import { Users, UserPlus, Search, Trophy, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendsApi, usersApi } from '../services/api';
import { Link } from 'react-router-dom';

interface Friend {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  level: number;
  xp: number;
  avatarColor: string;
  avatarIcon?: string;
  friend_status?: 'friends' | 'pending' | 'received' | 'none';
}

interface FriendsCardProps {
  className?: string;
}

const FriendsCard: React.FC<FriendsCardProps> = ({ className = '' }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'friends' | 'suggestions'>('friends');

  const generateAvatar = (username: string, color: string) => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E${username.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

  // Fetch friends data
  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: friendsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch discover users data
  const { data: discoverData, isLoading: discoverLoading } = useQuery({
    queryKey: ['discover'],
    queryFn: () => usersApi.getDiscoverUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => friendsApi.sendRequest({ userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['discover'] });
    },
  });

  const handleAddFriend = async (friendId: string) => {
    try {
      await sendRequestMutation.mutateAsync({ userId: friendId });
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const friends = friendsData?.friends || [];
  const suggestions = discoverData || [];
  const loading = friendsLoading || discoverLoading;

  const renderFriendItem = (friend: Friend, showAddButton = false) => (
    <div key={friend.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="relative">
        <img
          src={generateAvatar(friend.username, friend.avatarColor)}
          alt={friend.username}
          className="w-10 h-10 rounded-full"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {friend.firstName && friend.lastName 
              ? `${friend.firstName} ${friend.lastName}` 
              : friend.username}
          </p>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {friend.level}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 mt-1">
          <div className="flex items-center space-x-1">
            <Trophy className="w-3 h-3 text-primary-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {friend.xp} XP
            </span>
          </div>
        </div>
      </div>
      
      {showAddButton && (
        <button
          onClick={() => handleAddFriend(friend.id)}
          disabled={sendRequestMutation.isPending}
          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Social
            </h3>
          </div>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mt-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'friends'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'suggestions'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Discover ({suggestions.length})
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {activeTab === 'friends' ? (
          <div className="space-y-1">
            {friends.length > 0 ? (
              friends.map(friend => renderFriendItem(friend))
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No friends yet. Start by discovering new people!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {suggestions.length > 0 ? (
              suggestions.map(friend => renderFriendItem(friend, true))
            ) : (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No suggestions available right now.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Link 
          to="/friends"
          className="w-full py-2 px-4 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium flex items-center justify-center"
        >
          View All Friends
        </Link>
      </div>
    </div>
  );
};

export default FriendsCard;