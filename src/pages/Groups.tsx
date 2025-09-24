import React, { useState } from 'react';
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
  UserPlus,
  Medal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

// Types
interface Group {
  id: string;
  name: string;
  description: string;
  habit_name: string;
  habit_category: string;
  creator_id: string;
  creator_username: string;
  start_date: string;
  end_date: string;
  target_frequency: number; // days per week
  is_public: boolean;
  member_count: number;
  created_at: string;
  status: 'upcoming' | 'active' | 'completed';
}

interface GroupMember {
  id: string;
  user_id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_color: string;
  joined_at: string;
  total_completions: number;
  completion_rate: number;
  current_streak: number;
  daily_completions: { [date: string]: boolean };
  rank: number;
}

const Groups: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>('my-groups');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  // Mock data for now - replace with real API calls
  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Morning Warriors',
      description: 'Start your day strong with early morning workouts!',
      habit_name: 'Morning Exercise',
      habit_category: 'fitness',
      creator_id: 'user1',
      creator_username: 'fitnessguru',
      start_date: '2025-09-20',
      end_date: '2025-10-20',
      target_frequency: 6,
      is_public: true,
      member_count: 12,
      created_at: '2025-09-15',
      status: 'active'
    },
    {
      id: '2',
      name: 'Reading Club 2025',
      description: 'Read for 30 minutes every day and share your progress!',
      habit_name: 'Daily Reading',
      habit_category: 'learning',
      creator_id: 'user2',
      creator_username: 'bookworm',
      start_date: '2025-09-25',
      end_date: '2025-11-25',
      target_frequency: 7,
      is_public: true,
      member_count: 8,
      created_at: '2025-09-10',
      status: 'upcoming'
    },
    {
      id: '3',
      name: 'Meditation Masters',
      description: 'Daily mindfulness practice for inner peace',
      habit_name: 'Meditation',
      habit_category: 'mindfulness',
      creator_id: user?.id || '',
      creator_username: user?.username || '',
      start_date: '2025-09-01',
      end_date: '2025-09-30',
      target_frequency: 5,
      is_public: false,
      member_count: 5,
      created_at: '2025-08-25',
      status: 'active'
    }
  ];

  const mockGroupMembers: GroupMember[] = [
    {
      id: '1',
      user_id: 'user1',
      username: 'fitnessguru',
      first_name: 'John',
      last_name: 'Doe',
      avatar_color: '#10b981',
      joined_at: '2025-09-20',
      total_completions: 18,
      completion_rate: 85,
      current_streak: 3,
      daily_completions: {
        '2025-09-24': true,
        '2025-09-23': true,
        '2025-09-22': false,
        '2025-09-21': true,
        '2025-09-20': true,
      },
      rank: 1
    },
    {
      id: '2',
      user_id: user?.id || '',
      username: user?.username || '',
      first_name: user?.firstName,
      last_name: user?.lastName,
      avatar_color: user?.avatarColor || '#3b82f6',
      joined_at: '2025-09-20',
      total_completions: 15,
      completion_rate: 71,
      current_streak: 2,
      daily_completions: {
        '2025-09-24': true,
        '2025-09-23': true,
        '2025-09-22': false,
        '2025-09-21': false,
        '2025-09-20': true,
      },
      rank: 2
    },
    {
      id: '3',
      user_id: 'user3',
      username: 'healthylife',
      first_name: 'Sarah',
      last_name: 'Johnson',
      avatar_color: '#8b5cf6',
      joined_at: '2025-09-21',
      total_completions: 12,
      completion_rate: 67,
      current_streak: 1,
      daily_completions: {
        '2025-09-24': false,
        '2025-09-23': true,
        '2025-09-22': true,
        '2025-09-21': false,
        '2025-09-20': false,
      },
      rank: 3
    }
  ];

  const generateAvatar = (username: string, color: string) => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E${username.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

  const getStatusBadge = (status: Group['status']) => {
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

  const getCategoryIcon = (category: string) => {
    const icons = {
      fitness: '💪',
      learning: '📚',
      mindfulness: '🧘',
      health: '🍏',
      productivity: '⚡',
      social: '👥',
      other: '🎯'
    };
    return icons[category as keyof typeof icons] || '🎯';
  };

  const getLastWeekDates = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const filteredGroups = mockGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.habit_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || group.status === filterStatus;
    const matchesTab = activeTab === 'my-groups' 
      ? group.creator_id === user?.id || true // For demo, show all groups as "joined"
      : group.is_public;
    
    return matchesSearch && matchesFilter && matchesTab;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Habit Competitions</h1>
              <p className="text-purple-100">Compete with friends and stay motivated together!</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold">3</div>
                <div className="text-purple-200 text-sm">Active Groups</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">#2</div>
                <div className="text-purple-200 text-sm">Best Rank</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('my-groups')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'my-groups'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                My Groups
              </button>
              <button
                onClick={() => setActiveTab('discover')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'discover'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Discover Groups
              </button>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Create Group
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search groups or habits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 w-full"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="input-field sm:w-48"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredGroups.map((group) => (
              <motion.div
                key={group.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedGroup(group)}
              >
                {/* Group Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getCategoryIcon(group.habit_category)}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {group.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        by @{group.creator_username}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(group.status)}
                </div>

                {/* Habit Info */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-primary-600" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {group.habit_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{group.target_frequency}x/week</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{group.member_count} members</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {group.description}
                </p>

                {/* Duration */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    {new Date(group.start_date).toLocaleDateString()} - {new Date(group.end_date).toLocaleDateString()}
                  </span>
                  {group.creator_id === user?.id && (
                    <div title="You created this group">
                      <Crown className="w-4 h-4 text-yellow-500" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No groups found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {activeTab === 'my-groups'
                ? "You haven't joined any groups yet."
                : "No public groups match your criteria."}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Group
            </button>
          </div>
        )}

        {/* Group Detail Modal */}
        <AnimatePresence>
          {selectedGroup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedGroup(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{getCategoryIcon(selectedGroup.habit_category)}</div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {selectedGroup.name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          Created by @{selectedGroup.creator_username} • {selectedGroup.member_count} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(selectedGroup.status)}
                      <button
                        onClick={() => setSelectedGroup(null)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Group Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Group Details
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-primary-600" />
                            <span className="font-medium">Habit:</span>
                            <span>{selectedGroup.habit_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-primary-600" />
                            <span className="font-medium">Target:</span>
                            <span>{selectedGroup.target_frequency} times per week</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-primary-600" />
                            <span className="font-medium">Members:</span>
                            <span>{selectedGroup.member_count} participants</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Description
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedGroup.description}
                        </p>
                      </div>

                      <div>
                        <button className="btn-primary w-full">
                          <UserPlus className="w-4 h-4" />
                          Join Competition
                        </button>
                      </div>
                    </div>

                    {/* Leaderboard */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Leaderboard
                      </h3>
                      <div className="space-y-3">
                        {mockGroupMembers.map((member, index) => (
                          <div
                            key={member.id}
                            className={`p-4 rounded-lg border ${
                              member.user_id === user?.id
                                ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20'
                                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                  {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                                  {index === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                                  {index === 2 && <Medal className="w-4 h-4 text-amber-600" />}
                                  <span className="font-bold text-lg">#{member.rank}</span>
                                </div>
                                <img
                                  src={generateAvatar(member.username, member.avatar_color)}
                                  alt={member.username}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {member.first_name && member.last_name
                                      ? `${member.first_name} ${member.last_name}`
                                      : `@${member.username}`}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {member.completion_rate}% completion rate
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Flame className="w-4 h-4 text-orange-500" />
                                <span className="font-medium">{member.current_streak}</span>
                              </div>
                            </div>
                            
                            {/* Weekly Progress */}
                            <div className="flex items-center space-x-1">
                              {getLastWeekDates().map((date) => {
                                const completed = member.daily_completions[date];
                                return (
                                  <div
                                    key={date}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                      completed
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-400'
                                    }`}
                                    title={`${date}: ${completed ? 'Completed' : 'Not completed'}`}
                                  >
                                    {completed ? (
                                      <CheckCircle className="w-3 h-3" />
                                    ) : (
                                      <XCircle className="w-3 h-3" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Group Modal - Placeholder */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Create New Group
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create a competition group for your favorite habit. Coming soon!
                  </p>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Groups;
