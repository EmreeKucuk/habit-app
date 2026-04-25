import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Plus, 
  Calendar, 
  Target, 
  Crown, 
  Flame, 
  CheckCircle, 
  XCircle,
  Search,
  Medal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { groupsApi } from '../services/api';
import { Group as GroupType } from '../types';

const Groups: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>('my-groups');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [notification, setNotification] = useState<{ message: string; visible: boolean; type: 'success' | 'error' }>({ 
    message: '', 
    visible: false, 
    type: 'success' 
  });
  
  // Create group form state
  const [createGroupForm, setCreateGroupForm] = useState({
    name: '',
    description: '',
    habit_name: '',
    habit_category: 'Health & Fitness',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    target_frequency: 7,
    is_public: true
  });

  // API Queries
  const { 
    data: groups = [], 
    isLoading: groupsLoading, 
    error: groupsError,
    refetch: refetchGroups
  } = useQuery({
    queryKey: ['groups', activeTab, searchTerm, filterStatus],
    queryFn: () => groupsApi.getAll({ 
      type: activeTab,
      search: searchTerm || undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined
    }),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const { 
    data: selectedGroupDetails,
    isLoading: groupDetailsLoading 
  } = useQuery({
    queryKey: ['group-details', selectedGroup?.id],
    queryFn: () => groupsApi.getById(selectedGroup!.id),
    enabled: !!selectedGroup?.id,
    staleTime: 10000
  });

  // Mutations
  const joinGroupMutation = useMutation({
    mutationFn: (groupId: string) => groupsApi.join(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      if (selectedGroup) {
        queryClient.invalidateQueries({ queryKey: ['group-details', selectedGroup.id] });
      }
    }
  });

  const leaveGroupMutation = useMutation({
    mutationFn: (groupId: string) => groupsApi.leave(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setSelectedGroup(null);
    }
  });

  const markCompletionMutation = useMutation({
    mutationFn: ({ groupId, date, notes }: { groupId: string; date?: string; notes?: string }) => 
      groupsApi.markCompletion(groupId, { date, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      if (selectedGroup) {
        queryClient.invalidateQueries({ queryKey: ['group-details', selectedGroup.id] });
      }
      setNotification({ 
        message: 'Completion recorded successfully!', 
        visible: true, 
        type: 'success' 
      });
      setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 3000);
    },
    onError: (error: any) => {
      console.error('Completion error:', error);
      let message = 'Failed to record completion. Please try again.';
      
      if (error?.response?.status === 409) {
        message = 'You have already completed this habit for today!';
      } else if (error?.response?.data?.error) {
        message = error.response.data.error;
      }
      
      setNotification({ 
        message, 
        visible: true, 
        type: 'error' 
      });
      setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 5000);
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: (data: any) => groupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setShowCreateModal(false);
      setCreateGroupForm({
        name: '',
        description: '',
        habit_name: '',
        habit_category: 'Health & Fitness',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        target_frequency: 7,
        is_public: true
      });
    }
  });

  // Helper functions
  const handleJoinGroup = (groupId: string) => {
    joinGroupMutation.mutate(groupId);
  };

  const handleLeaveGroup = (groupId: string) => {
    leaveGroupMutation.mutate(groupId);
  };

  const handleMarkCompletion = (groupId: string, date?: string, notes?: string) => {
    markCompletionMutation.mutate({ groupId, date, notes });
  };

  const handleCreateGroup = () => {
    createGroupMutation.mutate(createGroupForm);
  };

  const resetCreateForm = () => {
    setCreateGroupForm({
      name: '',
      description: '',
      habit_name: '',
      habit_category: 'Health & Fitness',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      target_frequency: 7,
      is_public: true
    });
  };

  const isCompletedToday = () => {
    if (!selectedGroupDetails || !user?.id) return false;
    
    const today = new Date().toISOString().split('T')[0];
    const currentUserMember = selectedGroupDetails.members?.find(member => member.user_id === user.id);
    
    if (!currentUserMember) return false;
    
    // Check if today is in daily_completions or if last_completion_date is today
    return currentUserMember.daily_completions?.[today] === true || 
           currentUserMember.last_completion_date === today;
  };

  const generateAvatar = (username: string, color: string) => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E${username.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

  const getStatusBadge = (status: GroupType['status']) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', label: 'Active' },
      upcoming: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', label: 'Upcoming' },
      completed: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', label: 'Completed' }
    };
    
    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getDaysInWeek = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dates = [];
    const today = new Date();
    
    // Get last 7 days instead of this week to match backend logic
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayIndex = date.getDay();
      const dayName = dayIndex === 0 ? 'Sun' : days[dayIndex - 1]; // Adjust for Sunday = 0
      
      dates.push({
        day: dayName,
        date: date.toISOString().split('T')[0],
        isToday: date.toDateString() === today.toDateString()
      });
    }
    return dates;
  };

  // Filter groups based on search and status  
  const filteredGroups = (groups as GroupType[]).filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.habit_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || group.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Loading state
  if (groupsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (groupsError) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">Error loading groups. Please try again.</p>
          <button 
            onClick={() => refetchGroups()} 
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Groups Competition</h1>
              <p className="text-purple-100">
                Join habit groups and compete with friends to stay motivated!
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Create Group
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-1 flex">
          {(['my-groups', 'discover'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab === 'my-groups' ? 'My Groups' : 'Discover'}
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 dark:border-gray-700"
              onClick={() => setSelectedGroup(group)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {group.name}
                  </h3>
                  {getStatusBadge(group.status)}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {group.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Target size={16} />
                    <span>{group.habit_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Users size={16} />
                    <span>{group.member_count} members</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Calendar size={16} />
                    <span>{group.target_frequency}x per week</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    by @{group.creator_username}
                  </span>
                  {group.is_member ? (
                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full">
                      Joined
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinGroup(group.id);
                      }}
                      disabled={joinGroupMutation.isPending}
                      className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 px-2 py-1 rounded-full transition-colors disabled:opacity-50"
                    >
                      {joinGroupMutation.isPending ? 'Joining...' : 'Join'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No groups found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {activeTab === 'my-groups' 
                ? "You haven't joined any groups yet. Discover some groups to get started!"
                : "No groups match your search criteria. Try adjusting your filters."
              }
            </p>
            {activeTab === 'my-groups' && (
              <button
                onClick={() => setActiveTab('discover')}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Discover Groups
              </button>
            )}
          </div>
        )}

        {/* Group Detail Modal */}
        <AnimatePresence>
          {selectedGroup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedGroup(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl w-full max-h-[90vh] overflow-y-auto mx-4 max-w-[95vw] 2xl:max-w-[85vw]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedGroup.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        {selectedGroup.description}
                      </p>
                      <div className="mt-3">
                        {getStatusBadge(selectedGroup.status)}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedGroup(null)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <XCircle size={24} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {/* Group Info */}
                    <div className="xl:col-span-1 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Group Details
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Target className="text-purple-600" size={20} />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedGroup.habit_name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {selectedGroup.habit_category}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Calendar className="text-blue-600" size={20} />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              Duration
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {new Date(selectedGroup.start_date).toLocaleDateString()} to {new Date(selectedGroup.end_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Flame className="text-orange-600" size={20} />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              Target Frequency
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {selectedGroup.target_frequency} times per week
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Users className="text-green-600" size={20} />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              Members
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {selectedGroup.member_count} active members
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4">
                        {selectedGroup.is_member ? (
                          <div className="space-y-2">
                            {(() => {
                              const completedToday = isCompletedToday();
                              return (
                                <button
                                  onClick={() => !completedToday && handleMarkCompletion(selectedGroup.id)}
                                  disabled={markCompletionMutation.isPending || completedToday}
                                  className={`w-full px-4 py-2 rounded-lg transition-colors ${
                                    completedToday
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 cursor-not-allowed'
                                      : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                                  }`}
                                >
                                  {markCompletionMutation.isPending 
                                    ? 'Marking...' 
                                    : completedToday 
                                      ? '✅ Completed Today' 
                                      : 'Mark Today Complete'
                                  }
                                </button>
                              );
                            })()}
                            {selectedGroup.creator_id !== user?.id && (
                              <button
                                onClick={() => handleLeaveGroup(selectedGroup.id)}
                                disabled={leaveGroupMutation.isPending}
                                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {leaveGroupMutation.isPending ? 'Leaving...' : 'Leave Group'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleJoinGroup(selectedGroup.id)}
                            disabled={joinGroupMutation.isPending}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                          >
                            {joinGroupMutation.isPending ? 'Joining...' : 'Join Group'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="xl:col-span-2 2xl:col-span-3 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Leaderboard
                      </h3>
                      
                      {groupDetailsLoading ? (
                        <div className="animate-pulse space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {selectedGroupDetails?.members?.map((member, index) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {index === 0 && <Crown className="text-yellow-500" size={20} />}
                                {index === 1 && <Medal className="text-gray-400" size={18} />}
                                {index === 2 && <Medal className="text-amber-600" size={18} />}
                                <span className="font-bold text-lg text-gray-600 dark:text-gray-300 min-w-[30px]">
                                  #{member.rank}
                                </span>
                              </div>
                              
                              <img
                                src={generateAvatar(member.username, member.avatar_color)}
                                alt={member.username}
                                className="w-12 h-12 rounded-full flex-shrink-0"
                              />
                              
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                                  {member.first_name} {member.last_name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  @{member.username}
                                </p>
                              </div>

                              <div className="hidden sm:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                                <div className="text-center">
                                  <div className="font-bold text-lg text-gray-900 dark:text-white">{member.total_completions || 0}</div>
                                  <div className="text-xs">completions</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-lg text-gray-900 dark:text-white">{Math.round(member.completion_rate || 0)}%</div>
                                  <div className="text-xs">rate</div>
                                </div>
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Flame size={16} className="text-orange-500" />
                                    <span className="font-bold text-lg text-gray-900 dark:text-white">{member.current_streak || 0}</span>
                                  </div>
                                  <div className="text-xs">streak</div>
                                </div>
                              </div>

                              {/* Weekly Progress - Always visible but responsive */}
                              <div className="flex gap-1 flex-shrink-0 ml-2">
                                {getDaysInWeek().map((day) => {
                                  const completed = member.daily_completions?.[day.date];
                                  return (
                                    <div
                                      key={day.date}
                                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs flex flex-col items-center justify-center font-medium ${
                                        completed
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                          : day.isToday
                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                          : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                                      }`}
                                      title={`${day.day} ${day.date} - ${completed ? 'Completed' : 'Not completed'}`}
                                    >
                                      <div className="text-[8px] sm:text-[10px] leading-none">{day.day.slice(0,1)}</div>
                                      {completed ? (
                                        <CheckCircle size={12} />
                                      ) : day.isToday ? (
                                        <div className="w-2 h-2 bg-current rounded-full"></div>
                                      ) : (
                                        <XCircle size={10} />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )) ?? (
                            <p className="text-gray-600 dark:text-gray-300 text-center py-4">
                              No members data available
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create New Group
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <XCircle size={24} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateGroup(); }} className="space-y-4">
                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createGroupForm.name}
                    onChange={(e) => setCreateGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Morning Runners Club"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={createGroupForm.description}
                    onChange={(e) => setCreateGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe your group and what members should expect..."
                  />
                </div>

                {/* Habit Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Habit Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createGroupForm.habit_name}
                    onChange={(e) => setCreateGroupForm(prev => ({ ...prev, habit_name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Morning Run"
                  />
                </div>

                {/* Habit Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={createGroupForm.habit_category}
                    onChange={(e) => setCreateGroupForm(prev => ({ ...prev, habit_category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Health & Fitness">Health & Fitness</option>
                    <option value="Learning">Learning</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Mindfulness">Mindfulness</option>
                    <option value="Social">Social</option>
                    <option value="Creativity">Creativity</option>
                    <option value="Career">Career</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={createGroupForm.start_date}
                      onChange={(e) => setCreateGroupForm(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={createGroupForm.end_date}
                      onChange={(e) => setCreateGroupForm(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Target Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Frequency (times per week) *
                  </label>
                  <select
                    required
                    value={createGroupForm.target_frequency}
                    onChange={(e) => setCreateGroupForm(prev => ({ ...prev, target_frequency: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={1}>1 time per week</option>
                    <option value={2}>2 times per week</option>
                    <option value={3}>3 times per week</option>
                    <option value={4}>4 times per week</option>
                    <option value={5}>5 times per week</option>
                    <option value={6}>6 times per week</option>
                    <option value={7}>Daily (7 times per week)</option>
                  </select>
                </div>

                {/* Public/Private */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Group Visibility
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="is_public"
                        checked={createGroupForm.is_public}
                        onChange={() => setCreateGroupForm(prev => ({ ...prev, is_public: true }))}
                        className="text-purple-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Public - Anyone can discover and join</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="is_public"
                        checked={!createGroupForm.is_public}
                        onChange={() => setCreateGroupForm(prev => ({ ...prev, is_public: false }))}
                        className="text-purple-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Private - Invite only</span>
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createGroupMutation.isPending}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Notification */}
      {notification.visible && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <span className="text-green-600 dark:text-green-400">✅</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">⚠️</span>
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Groups;