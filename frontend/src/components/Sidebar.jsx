/**
 * Sidebar Component - Navigation with user profile and theme toggle
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, LogOut, BarChart3, CreditCard, Wallet, User, ChevronLeft, ChevronRight, ImagePlus, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSidebarCollapsed } from '../context/SidebarContext';
import { logout } from '../api';
import UserAvatar from './UserAvatar';

function Sidebar({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebarCollapsed();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/transactions', label: 'Transactions', icon: CreditCard },
    { path: '/budget', label: 'Budget', icon: Wallet },
    { path: '/receipt-upload', label: 'Receipt Upload', icon: ImagePlus },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/about', label: 'About', icon: Info },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  // Get user display name (first and last name or username)
  const getUserName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.first_name || user?.username || 'User';
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-50 p-2 rounded-lg transition-all md:hidden ${
          isDark
            ? 'bg-slate-800 hover:bg-slate-700 text-amber-400'
            : 'bg-slate-200 hover:bg-slate-300 text-amber-600'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen transition-all duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isDark
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white border-slate-200'
        } border-r flex flex-col ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div
          className={`p-4 border-b ${
            isDark ? 'border-slate-700' : 'border-slate-200'
          } flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            {!isCollapsed && (
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-gradient-to-br from-amber-400/30 to-amber-500/30 border border-amber-400/40' : 'bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300'
              }`}>
                <span className={`${isDark ? 'text-slate-900' : 'text-amber-700'} font-bold`}>FT</span>
              </div>
            )}
            {!isCollapsed && (
              <span className={`${isDark ? 'text-white' : 'text-slate-900'} font-semibold`}>Finance Tracker</span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-lg transition-all hidden md:block ${
              isDark
                ? 'hover:bg-slate-800 text-slate-400 hover:text-amber-400'
                : 'hover:bg-slate-100 text-slate-600 hover:text-amber-600'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* User Profile Section */}
        {!isCollapsed && (
          <div
            className={`p-6 border-b ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            } flex flex-col items-center text-center`}
          >
            {user && <UserAvatar user={user} size="w-20 h-20" />}
            <div className="mt-4">
              <p className={`font-semibold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {getUserName()}
              </p>
              <p className={`text-sm truncate ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {user?.email}
              </p>
            </div>
          </div>
        )}

        {/* Collapsed User Avatar */}
        {isCollapsed && user && (
          <div className="p-4 flex justify-center border-b border-slate-700">
            <UserAvatar user={user} size="w-10 h-10" />
          </div>
        )}

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? item.label : ''}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                  isActive(item.path)
                    ? isDark
                      ? 'bg-gradient-to-r from-amber-400/15 to-amber-500/10 text-amber-400 border-amber-400/40 shadow-lg'
                      : 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-300 shadow'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-amber-400 border-slate-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-amber-600 border-slate-200'
                }`}
              >
                {isActive(item.path) && <span className="w-1.5 h-6 rounded-full bg-amber-400" />}
                <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={`p-4 border-t space-y-2 ${
            isDark ? 'border-slate-700' : 'border-slate-200'
          }`}
        >
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-amber-600'
            }`}
          >
            {isDark ? (
              <Sun className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Moon className="w-5 h-5 flex-shrink-0" />
            )}
            {!isCollapsed && <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Logout"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isDark
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                : 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300'
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
