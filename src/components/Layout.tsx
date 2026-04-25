import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'add-habit', label: 'Add Habit', icon: Plus, path: '/add-habit' },
    { id: 'templates', label: 'Templates', icon: FileText, path: '/templates' },
    { id: 'groups', label: 'Groups', icon: Users, path: '/groups' },
    { id: 'friends', label: 'Friends', icon: UserPlus, path: '/friends' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
    { id: 'discover', label: 'Discover', icon: Search, path: '/discover' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  const generateAvatar = (username: string, color: string) => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E${username.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full flex flex-col hidden lg:flex">
        {/* Website Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                HabitForge
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Build Better Habits</p>
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
                  className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <img
              src={generateAvatar(user?.username || 'U', user?.avatarColor || '#3b82f6')}
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Level {user?.level}</p>
            </div>
          </div>
          
          <div className="mt-3 flex space-x-2">
            <button
              onClick={toggleTheme}
              className="flex-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-gray-600 dark:text-gray-300 mx-auto" />
              ) : (
                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300 mx-auto" />
              )}
            </button>
            <button
              onClick={logout}
              className="flex-1 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-600 dark:text-red-400 mx-auto" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64">
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="px-4 lg:px-12 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile logo/brand for screens < lg */}
              <div className="lg:hidden">
                <Link to="/dashboard" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">H</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-gray-100">HabitForge</span>
                </Link>
              </div>
              
              {/* User Stats - Desktop */}
              <div className="hidden lg:flex items-center space-x-4 ml-auto">
                <div className="flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-2 rounded-lg">
                  <Star className="w-4 h-4" />
                  <span className="font-semibold">{user?.xp || 0} XP</span>
                </div>
                
                <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-lg">
                  <Target className="w-4 h-4" />
                  <span className="font-semibold">Level {user?.level || 1}</span>
                </div>
                
                <div className="flex items-center space-x-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-3 py-2 rounded-lg">
                  <Flame className="w-4 h-4" />
                  <span className="font-semibold">{user?.highestStreak || 0} Streak</span>
                </div>
                
                <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg">
                  <BarChart3 className="w-4 h-4" />
                  <span className="font-semibold">{user?.successPercentage || 0}%</span>
                </div>
              </div>

              {/* Mobile menu and user info */}
              <div className="lg:hidden flex items-center space-x-3">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  )}
                </button>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
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
    </div>
  );
};

export default Layout;
