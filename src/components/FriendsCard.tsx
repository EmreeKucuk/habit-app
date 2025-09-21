import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Trophy, Flame, Star } from 'lucide-react';

interface Friend {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  level: number;
  xp: number;
  highestStreak: number;
  successPercentage: number;
  avatarColor: string;
  isOnline?: boolean;
  lastActivity?: string;
}

interface FriendsCardProps {
  className?: string;
}

const FriendsCard: React.FC<FriendsCardProps> = ({ className = '' }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [suggestions, setSuggestions] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'suggestions'>('friends');

  const generateAvatar = (username: string, color: string) => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E${username.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

  const fetchFriends = async () => {
    try {
      // Mock friends data for now
      const mockFriends: Friend[] = [
        {
          id: '1',
          username: 'alex_fit',
          firstName: 'Alex',
          lastName: 'Johnson',
          level: 12,
          xp: 2450,
          highestStreak: 45,
          successPercentage: 87,
          avatarColor: '#10b981',
          isOnline: true,
          lastActivity: '2 hours ago'
        },
        {
          id: '2',
          username: 'sarah_goals',
          firstName: 'Sarah',
          lastName: 'Wilson',
          level: 8,
          xp: 1680,
          highestStreak: 23,
          successPercentage: 92,
          avatarColor: '#8b5cf6',
          isOnline: false,
          lastActivity: '1 day ago'
        },
        {
          id: '3',
          username: 'mike_healthy',
          firstName: 'Mike',
          lastName: 'Chen',
          level: 15,
          xp: 3200,
          highestStreak: 67,
          successPercentage: 94,
          avatarColor: '#f59e0b',
          isOnline: true,
          lastActivity: '30 minutes ago'
        }
      ];

      const mockSuggestions: Friend[] = [
        {
          id: '4',
          username: 'emma_wellness',
          firstName: 'Emma',
          lastName: 'Brown',
          level: 6,
          xp: 1200,
          highestStreak: 18,
          successPercentage: 85,
          avatarColor: '#ef4444'
        },
        {
          id: '5',
          username: 'david_runner',
          firstName: 'David',
          lastName: 'Lee',
          level: 10,
          xp: 2100,
          highestStreak: 34,
          successPercentage: 89,
          avatarColor: '#3b82f6'
        }
      ];

      setFriends(mockFriends);
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleAddFriend = async (friendId: string) => {
    try {
      // Mock add friend functionality
      console.log('Adding friend:', friendId);
      // Move from suggestions to friends
      const friend = suggestions.find(s => s.id === friendId);
      if (friend) {
        setFriends(prev => [...prev, friend]);
        setSuggestions(prev => prev.filter(s => s.id !== friendId));
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const renderFriendItem = (friend: Friend, showAddButton = false) => (
    <div key={friend.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="relative">
        <img
          src={generateAvatar(friend.username, friend.avatarColor)}
          alt={friend.username}
          className="w-10 h-10 rounded-full"
        />
        {friend.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
        )}
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
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {friend.highestStreak}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Trophy className="w-3 h-3 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {friend.successPercentage}%
            </span>
          </div>
        </div>
        
        {friend.lastActivity && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {friend.lastActivity}
          </p>
        )}
      </div>
      
      {showAddButton && (
        <button
          onClick={() => handleAddFriend(friend.id)}
          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
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
        <button className="w-full py-2 px-4 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium">
          View All Friends
        </button>
      </div>
    </div>
  );
};

export default FriendsCard;