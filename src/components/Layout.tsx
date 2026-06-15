import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { usersApi, motivationApi } from '../services/api';
import {
  Home,
  Plus,
  FileText,
  Users,
  UserPlus,
  BarChart3,
  Search,
  User,
  LogOut,
  Sun,
  Moon,
  Star,
  Flame,
  Target
} from 'lucide-react';
import SproutChatWidget from './SproutChatWidget';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const { data: userStats } = useQuery({
    queryKey: ['user-stats', 'profile'],
    queryFn: () => usersApi.getStats(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: motivationScore } = useQuery({
    queryKey: ['motivation-score'],
    queryFn: () => motivationApi.getScore(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'add-habit', label: 'Add Habit', icon: Plus, path: '/add-habit' },
    { id: 'templates', label: 'Templates', icon: FileText, path: '/templates' },
    { id: 'friends', label: 'Friends', icon: UserPlus, path: '/friends' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
    { id: 'discover', label: 'Discover', icon: Search, path: '/discover' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  const generateAvatar = (username: string, color: string) => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E${username.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

  return (
    <div className="min-h-screen bg-[#FEFAE0] dark:bg-gray-900 flex text-[#344E41] dark:text-gray-100">
      {/* Left Sidebar */}
      <div className="w-64 bg-[#FEFAE0] dark:bg-gray-900 fixed h-full flex flex-col hidden lg:flex border-r border-[#344E41] dark:border-gray-700/10">
        {/* Website Logo */}
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#A3B18A] dark:bg-gray-800 rounded-xl flex items-center justify-center">
              <span className="text-[#FEFAE0] dark:text-gray-300 font-bold text-xl">H</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#344E41] dark:text-gray-100">
                Sprout
              </h1>
              <p className="text-xs font-semibold text-[#344E41] dark:text-gray-100 opacity-60">Build Better Habits</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-[#A3B18A] dark:bg-gray-800 text-[#FEFAE0] dark:text-gray-300 shadow-sm'
                    : 'text-[#344E41] dark:text-gray-100 opacity-70 hover:opacity-100 hover:bg-[#344E41] dark:bg-gray-700/5'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 pb-6">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-[#A3B18A] dark:bg-gray-800 bg-opacity-20">
            <img
              src={generateAvatar(user?.username || 'U', user?.avatarColor || '#A3B18A')}
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#344E41] dark:text-gray-100 truncate">
                {user?.username}
              </p>
              <p className="text-xs font-semibold text-[#344E41] dark:text-gray-100 opacity-70">Level {user?.level}</p>
            </div>
          </div>

          <div className="mt-3 flex space-x-2">
            <button
              onClick={toggleTheme}
              className="flex-1 p-2.5 rounded-xl bg-[#344E41] dark:bg-gray-700 bg-opacity-5 hover:bg-opacity-10 transition-colors flex justify-center items-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#344E41] dark:text-gray-100" />
              ) : (
                <Moon className="w-4 h-4 text-[#344E41] dark:text-gray-100" />
              )}
            </button>
            <button
              onClick={logout}
              className="flex-1 p-2.5 rounded-xl bg-[#E9C46A] dark:bg-yellow-600 bg-opacity-80 hover:bg-opacity-100 transition-colors flex justify-center items-center"
            >
              <LogOut className="w-4 h-4 text-[#344E41] dark:text-gray-100" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64">
        {/* Top Header Bar */}
        <header className="bg-[#FEFAE0] dark:bg-gray-900 sticky top-0 z-40 bg-opacity-90 backdrop-blur-sm">
          <div className="px-4 lg:px-12 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile logo/brand for screens < lg */}
              <div className="lg:hidden">
                <Link to="/dashboard" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[#A3B18A] dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-[#FEFAE0] dark:text-gray-300 font-bold text-sm">H</span>
                  </div>
                  <span className="font-bold text-[#344E41] dark:text-gray-100">Sprout</span>
                </Link>
              </div>

              {/* User Stats - Desktop */}
              <div className="hidden lg:flex items-center space-x-4 ml-auto">
                <div className="flex items-center space-x-2 bg-[#E9C46A] dark:bg-yellow-900/60 bg-opacity-20 text-[#344E41] dark:text-yellow-50 px-4 py-2 rounded-xl">
                  <Star className="w-4 h-4" />
                  <span className="font-bold">{user?.xp || 0} XP</span>
                </div>

                <div className="flex items-center space-x-2 bg-[#A3B18A] dark:bg-green-900/60 bg-opacity-20 text-[#344E41] dark:text-green-50 px-4 py-2 rounded-xl">
                  <Target className="w-4 h-4" />
                  <span className="font-bold">Level {user?.level || 1}</span>
                </div>

                <div className="flex items-center space-x-2 bg-[#E9C46A] dark:bg-yellow-900/60 bg-opacity-40 text-[#344E41] dark:text-yellow-50 px-4 py-2 rounded-xl">
                  <Flame className="w-4 h-4" />
                  <span className="font-bold">{userStats?.currentStreak || user?.highestStreak || 0} Streak</span>
                </div>

                {motivationScore && (
                  <div className="flex items-center space-x-2 bg-[#A3B18A] dark:bg-green-900/60 bg-opacity-40 text-[#344E41] dark:text-green-50 px-4 py-2 rounded-xl">
                    <BarChart3 className="w-4 h-4" />
                    <span className="font-bold">
                      {Math.round(motivationScore.score)}/100 {motivationScore.level.charAt(0).toUpperCase() + motivationScore.level.slice(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Mobile menu and user info */}
              <div className="lg:hidden flex items-center space-x-3">
                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl bg-[#344E41] dark:bg-gray-700 bg-opacity-5 hover:bg-opacity-10 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-[#344E41] dark:text-gray-100" />
                  ) : (
                    <Moon className="w-5 h-5 text-[#344E41] dark:text-gray-100" />
                  )}
                </button>
                <button
                  onClick={logout}
                  className="p-2.5 rounded-xl bg-[#E9C46A] dark:bg-yellow-600 bg-opacity-80 hover:bg-opacity-100 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-[#344E41] dark:text-gray-100" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:py-8 flex justify-center">
          <div className="w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <SproutChatWidget />
    </div>
  );
};

export default Layout;
