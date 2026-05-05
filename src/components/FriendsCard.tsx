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
    <div key={friend.id} className="flex items-center space-x-4 p-3 rounded-2xl hover:bg-[#A3B18A]/10 transition-colors">
      <div className="relative">
        <img
          src={generateAvatar(friend.username, friend.avatarColor)}
          alt={friend.username}
          className="w-12 h-12 rounded-full shadow-sm"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-black text-[#344E41] truncate">
            {friend.firstName && friend.lastName 
              ? `${friend.firstName} ${friend.lastName}` 
              : friend.username}
          </p>
          <div className="flex items-center space-x-1">
            <Star className="w-3.5 h-3.5 text-[#E9C46A]" />
            <span className="text-xs font-black text-[#344E41] opacity-80">
              {friend.level}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 mt-1">
          <div className="flex items-center space-x-1">
            <Trophy className="w-3.5 h-3.5 text-[#A3B18A]" />
            <span className="text-xs font-bold text-[#344E41] opacity-60">
              {friend.xp} XP
            </span>
          </div>
        </div>
      </div>
      
      {showAddButton && (
        <button
          onClick={() => handleAddFriend(friend.id)}
          disabled={sendRequestMutation.isPending}
          className="p-2.5 bg-[#E9C46A] text-[#344E41] hover:bg-[#d4b05a] rounded-xl transition-colors disabled:opacity-50 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={`bg-[#A3B18A]/5 rounded-3xl p-8 border border-[#344E41]/5 ${className}`}>
        <div className="animate-pulse space-y-5">
          <div className="h-6 bg-[#344E41]/10 rounded-lg w-3/4 mb-2"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#344E41]/10 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-[#344E41]/10 rounded w-3/4"></div>
                  <div className="h-3 bg-[#344E41]/10 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#FEFAE0] rounded-3xl shadow-[0_4px_20px_rgb(52,78,65,0.05)] border border-[#344E41]/5 flex flex-col h-full hover:shadow-[0_8px_30px_rgb(52,78,65,0.08)] transition-all ${className}`}>
      {/* Header */}
      <div className="p-8 pb-6 border-b border-[#344E41]/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-[#E9C46A]" />
            <h3 className="text-xl font-black text-[#344E41] tracking-tight">
              Social
            </h3>
          </div>
          
          <button className="p-2 hover:bg-[#344E41]/10 rounded-xl transition-colors">
            <Search className="w-5 h-5 text-[#344E41] opacity-50" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mt-6 bg-[#A3B18A]/10 rounded-xl p-1.5">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2.5 px-3 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'friends'
                ? 'bg-[#FEFAE0] text-[#344E41] shadow-sm'
                : 'text-[#344E41] opacity-60 hover:opacity-100 hover:bg-[#344E41]/5'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-2.5 px-3 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'suggestions'
                ? 'bg-[#FEFAE0] text-[#344E41] shadow-sm'
                : 'text-[#344E41] opacity-60 hover:opacity-100 hover:bg-[#344E41]/5'
            }`}
          >
            Discover ({suggestions.length})
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto min-h-[200px]">
        {activeTab === 'friends' ? (
          <div className="space-y-2">
            {friends.length > 0 ? (
              friends.map(friend => renderFriendItem(friend))
            ) : (
              <div className="text-center py-12 flex flex-col justify-center">
                <Users className="w-14 h-14 text-[#344E41] opacity-20 mx-auto mb-4" />
                <p className="text-[#344E41] font-bold opacity-60 text-sm">
                  No friends yet. Start by discovering new people!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {suggestions.length > 0 ? (
              suggestions.map(friend => renderFriendItem(friend, true))
            ) : (
              <div className="text-center py-12 flex flex-col justify-center">
                <UserPlus className="w-14 h-14 text-[#344E41] opacity-20 mx-auto mb-4" />
                <p className="text-[#344E41] font-bold opacity-60 text-sm">
                  No suggestions available right now.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-6 border-t border-[#344E41]/10 mt-auto">
        <Link 
          to="/friends"
          className="w-full py-3.5 px-4 bg-[#A3B18A]/20 text-[#344E41] rounded-xl hover:bg-[#A3B18A]/40 transition-colors text-sm font-black flex items-center justify-center uppercase tracking-wider"
        >
          View All Friends
        </Link>
      </div>
    </div>
  );
};

export default FriendsCard;