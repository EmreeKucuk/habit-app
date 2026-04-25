import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Plus, 
  FileText, 
  Users, 
  UserPlus, 
  BarChart3, 
  Search, 
  User 
} from 'lucide-react';

interface NavigationProps {
  currentPage: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage }) => {
  const location = useLocation();

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

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
