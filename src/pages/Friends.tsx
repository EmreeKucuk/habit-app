import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, UserMinus, UserCheck, Search, MessageCircle } from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { friendsApi } from '../services/api';

const Friends: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent'>('friends');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch friends data
  const { data: friendsData, isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: friendsApi.getAll,
    enabled: !!user,
  });

  const generateAvatar = (username: string, color: string) => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E${username.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

  // Mock data for demonstration
  const friends = friendsData?.friends || [];
  const receivedRequests = friendsData?.receivedRequests || [];
  const sentRequests = friendsData?.sentRequests || [];

  const acceptFriendMutation = useMutation({
    mutationFn: (data: { userId: string }) => friendsApi.acceptRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });

  const rejectFriendMutation = useMutation({
    mutationFn: (data: { userId: string }) => friendsApi.rejectRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });

  const removeFriendMutation = useMutation({
    mutationFn: (data: { userId: string }) => friendsApi.remove(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (data: { userId: string }) => friendsApi.rejectRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });

  const filteredData = () => {
    let data: any[] = [];
    switch (activeTab) {
      case 'friends':
        data = friends;
        break;
      case 'requests':
        data = receivedRequests;
        break;
      case 'sent':
        data = sentRequests;
        break;
    }

    if (searchTerm.trim()) {
      data = data.filter(person => 
        person.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return data;
  };

  const renderPersonCard = (person: any) => (
    <div key={person.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={generateAvatar(person.username, person.avatar_color)}
            alt={person.username}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {person.first_name && person.last_name ? `${person.first_name} ${person.last_name}` : person.username}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{person.username}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        {activeTab === 'friends' && (
          <div className="flex items-center space-x-2">
            <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => removeFriendMutation.mutate({ userId: person.friend_user_id })}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <UserMinus className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {activeTab === 'requests' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => acceptFriendMutation.mutate({ userId: person.friend_user_id })}
              className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors flex items-center space-x-1"
            >
              <UserCheck className="w-3 h-3" />
              <span>Accept</span>
            </button>
            <button
              onClick={() => rejectFriendMutation.mutate({ userId: person.friend_user_id })}
              className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
            >
              Decline
            </button>
          </div>
        )}
        
        {activeTab === 'sent' && (
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm font-medium">
              Pending
            </div>
            <button
              onClick={() => cancelRequestMutation.mutate({ userId: person.friend_user_id })}
              disabled={cancelRequestMutation.isPending}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cancel friend request"
            >
              <UserMinus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{person.level}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Level</div>
        </div>
        <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{person.xp}</div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400">XP</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        {activeTab === 'friends' && (
          <>
            <div className="flex items-center justify-between">
              <span>Last Active:</span>
              <span className="font-medium">{person.lastActive}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Mutual Habits:</span>
              <span className="font-medium text-primary-600 dark:text-primary-400">{person.mutualHabits}</span>
            </div>
          </>
        )}
        {(activeTab === 'requests' || activeTab === 'sent') && (
          <div className="flex items-center justify-between">
            <span>Sent:</span>
            <span className="font-medium">{person.sentAt}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Friends</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your connections and friend requests</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{isLoading ? 'Loading...' : `${filteredData().length} ${activeTab}`}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'friends'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Requests ({receivedRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Sent ({sentRequests.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Content Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData().map(renderPersonCard)}
          </div>
        )}

        {/* Empty States */}
        {!isLoading && filteredData().length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm ? 'No matches found' : `No ${activeTab} yet`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm ? 
                `No ${activeTab} match "${searchTerm}". Try a different search term.` :
                activeTab === 'friends' ? 
                  'Start building connections by sending friend requests!' :
                  activeTab === 'requests' ?
                    'No pending friend requests at the moment.' :
                    'No sent requests pending.'
              }
            </p>
            {!searchTerm && activeTab === 'friends' && (
              <button className="btn-primary">
                <UserPlus className="w-4 h-4 mr-2" />
                Discover People
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Friends;
