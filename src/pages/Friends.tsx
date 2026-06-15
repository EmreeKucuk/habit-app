import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, UserMinus, UserCheck, Search, MessageCircle, Activity, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { friendsApi } from '../services/api';

const Friends: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'activity' | 'friends' | 'requests' | 'sent'>('activity');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch friends data
  const { data: friendsData, isLoading: isFriendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: friendsApi.getAll,
    enabled: !!user,
  });

  // Fetch activity feed data
  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ['friendsActivity'],
    queryFn: friendsApi.getActivity,
    enabled: !!user && activeTab === 'activity',
  });

  const generateAvatar = (username: string, color: string) => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E${username.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

  const friends = friendsData?.friends || [];
  const receivedRequests = friendsData?.receivedRequests || [];
  const sentRequests = friendsData?.sentRequests || [];

  const acceptFriendMutation = useMutation({
    mutationFn: (data: { userId: string }) => friendsApi.acceptRequest(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] })
  });

  const rejectFriendMutation = useMutation({
    mutationFn: (data: { userId: string }) => friendsApi.rejectRequest(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] })
  });

  const removeFriendMutation = useMutation({
    mutationFn: (data: { userId: string }) => friendsApi.remove(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] })
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (data: { userId: string }) => friendsApi.rejectRequest(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] })
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
      default:
        return [];
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const renderActivityCard = (activity: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={activity.id} 
      className="bg-[#A3B18A] dark:bg-gray-800 rounded-xl shadow-sm border border-transparent hover:border-[#E9C46A] p-6 transition-all duration-300"
    >
      <div className="flex items-start space-x-4">
        <img
          src={generateAvatar(activity.friend_username, activity.avatar_color)}
          alt={activity.friend_username}
          className="w-12 h-12 rounded-full border-2 border-[#FEFAE0]"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-[#344E41] dark:text-gray-100 text-lg">
              {activity.friend_first_name && activity.friend_last_name 
                ? `${activity.friend_first_name} ${activity.friend_last_name}` 
                : activity.friend_username}
            </h3>
            <span className="flex items-center text-sm text-[#344E41] dark:text-gray-100 opacity-70">
              <Clock className="w-3 h-3 mr-1" />
              {formatTimeAgo(activity.completed_at)}
            </span>
          </div>
          <div className="mt-2 text-[#344E41] dark:text-gray-100">
            completed the <span className="font-bold text-[#E9C46A] bg-[#344E41] dark:bg-gray-700 px-2 py-0.5 rounded-md mx-1 shadow-sm">{activity.habit_name}</span> habit.
          </div>
          {activity.notes && (
            <div className="mt-3 p-3 bg-[#FEFAE0] dark:bg-gray-900 bg-opacity-40 rounded-lg italic text-[#344E41] dark:text-gray-100 border-l-4 border-[#E9C46A]">
              "{activity.notes}"
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderPersonCard = (person: any) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      key={person.id} 
      className="bg-[#A3B18A] dark:bg-gray-800 rounded-xl shadow-sm p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={generateAvatar(person.username, person.avatar_color)}
            alt={person.username}
            className="w-12 h-12 rounded-full border-2 border-[#FEFAE0]"
          />
          <div>
            <h3 className="font-semibold text-[#344E41] dark:text-gray-100">
              {person.first_name && person.last_name ? `${person.first_name} ${person.last_name}` : person.username}
            </h3>
            <p className="text-sm text-[#344E41] dark:text-gray-100 opacity-80">@{person.username}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        {activeTab === 'friends' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => removeFriendMutation.mutate({ userId: person.friend_user_id })}
              className="p-2 text-[#FEFAE0] dark:text-gray-300 hover:bg-[#344E41] dark:bg-gray-700 bg-[#344E41] dark:bg-gray-700/20 rounded-lg transition-colors"
            >
              <UserMinus className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {activeTab === 'requests' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => acceptFriendMutation.mutate({ userId: person.friend_user_id })}
              className="px-3 py-1 bg-[#344E41] dark:bg-gray-700 text-[#E9C46A] rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center space-x-1"
            >
              <UserCheck className="w-3 h-3" />
              <span>Accept</span>
            </button>
            <button
              onClick={() => rejectFriendMutation.mutate({ userId: person.friend_user_id })}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
            >
              Decline
            </button>
          </div>
        )}
        
        {activeTab === 'sent' && (
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-[#E9C46A] dark:bg-yellow-600 text-[#344E41] dark:text-gray-100 rounded-lg text-sm font-medium">
              Pending
            </div>
            <button
              onClick={() => cancelRequestMutation.mutate({ userId: person.friend_user_id })}
              disabled={cancelRequestMutation.isPending}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <UserMinus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 bg-[#FEFAE0] dark:bg-gray-900 rounded-lg">
          <div className="text-lg font-bold text-[#344E41] dark:text-gray-100">{person.level}</div>
          <div className="text-xs text-[#344E41] dark:text-gray-100 opacity-70">Level</div>
        </div>
        <div className="text-center p-2 bg-[#FEFAE0] dark:bg-gray-900 rounded-lg">
          <div className="text-lg font-bold text-[#E9C46A]">{person.xp}</div>
          <div className="text-xs text-[#344E41] dark:text-gray-100 opacity-70">XP</div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <Layout>
      <div className="min-h-full rounded-2xl p-6" style={{ backgroundColor: '#FEFAE0' }}>
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#344E41] dark:text-gray-100">Activity & Connections</h1>
              <p className="text-[#344E41] dark:text-gray-100 opacity-80 mt-1 text-lg">Follow your friends' journey and build your network</p>
            </div>
            
            <div className="flex items-center space-x-2 text-sm font-medium bg-[#A3B18A] dark:bg-gray-800 text-[#344E41] dark:text-gray-100 px-4 py-2 rounded-full shadow-sm">
              <Users className="w-4 h-4" />
              <span>{friends.length} Friends</span>
            </div>
          </div>

          {/* Custom Tabs */}
          <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
            {[
              { id: 'activity', label: 'Activity Feed', icon: Activity },
              { id: 'friends', label: 'Friends List', count: friends.length },
              { id: 'requests', label: 'Requests', count: receivedRequests.length },
              { id: 'sent', label: 'Sent', count: sentRequests.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center whitespace-nowrap px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-[#344E41] dark:bg-gray-700 text-[#E9C46A] shadow-md transform scale-105'
                    : 'bg-[#A3B18A] dark:bg-gray-800 text-[#344E41] dark:text-gray-100 hover:bg-opacity-80 hover:shadow-sm'
                }`}
              >
                {tab.icon && <tab.icon className="w-4 h-4 mr-2" />}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-[#E9C46A] dark:bg-yellow-600 text-[#344E41] dark:text-gray-100' : 'bg-[#FEFAE0] dark:bg-gray-900'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search for non-activity tabs */}
          {activeTab !== 'activity' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="relative"
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#344E41] dark:text-gray-100 opacity-50" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#A3B18A] dark:bg-gray-800 border-none text-[#344E41] dark:text-gray-100 placeholder-[#344E41] placeholder-opacity-50 rounded-xl focus:ring-2 focus:ring-[#344E41] outline-none transition-shadow"
              />
            </motion.div>
          )}

          {/* Loading State */}
          {(isFriendsLoading || (activeTab === 'activity' && isActivityLoading)) && (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {/* Activity Feed Content */}
          {!isFriendsLoading && activeTab === 'activity' && (
            <div className="space-y-4 max-w-3xl mx-auto mt-8">
              {!isActivityLoading && (!activityData || activityData.length === 0) ? (
                <div className="text-center py-16 bg-[#A3B18A] dark:bg-gray-800 rounded-2xl shadow-sm border border-[#A3B18A]">
                  <Activity className="w-16 h-16 text-[#344E41] dark:text-gray-100 opacity-50 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#344E41] dark:text-gray-100 mb-2">It's quiet here</h3>
                  <p className="text-[#344E41] dark:text-gray-100 opacity-80 max-w-md mx-auto">
                    When your friends complete habits, their progress will appear here. Build your network to see more activity!
                  </p>
                  <button 
                    onClick={() => setActiveTab('friends')}
                    className="mt-6 px-6 py-2 bg-[#344E41] dark:bg-gray-700 text-[#E9C46A] rounded-full font-medium hover:bg-opacity-90 transition-colors"
                  >
                    Find Friends
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {activityData?.map(renderActivityCard)}
                </AnimatePresence>
              )}
            </div>
          )}

          {/* Friends List/Requests Content */}
          {!isFriendsLoading && activeTab !== 'activity' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <AnimatePresence>
                  {filteredData().map(renderPersonCard)}
                </AnimatePresence>
              </div>

              {filteredData().length === 0 && (
                <div className="text-center py-16 bg-[#A3B18A] dark:bg-gray-800 rounded-2xl shadow-sm border border-[#A3B18A] mt-6">
                  <Users className="w-16 h-16 text-[#344E41] dark:text-gray-100 opacity-50 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#344E41] dark:text-gray-100 mb-2">
                    {searchTerm ? 'No matches found' : `No ${activeTab} yet`}
                  </h3>
                  <p className="text-[#344E41] dark:text-gray-100 opacity-80 mb-6">
                    {searchTerm ? 
                      `No ${activeTab} match "${searchTerm}".` :
                      activeTab === 'friends' ? 
                        'Start building connections by sending friend requests!' :
                        activeTab === 'requests' ?
                          'No pending friend requests at the moment.' :
                          'No sent requests pending.'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Friends;
