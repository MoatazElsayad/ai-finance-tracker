/**
 * Sidebar Component - Navigation with user profile and theme toggle
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, LogOut, BarChart3, CreditCard, Wallet, User, ChevronLeft, ChevronRight, ImagePlus, Info, Target, Landmark, ShoppingCart } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSidebarCollapsed } from '../context/SidebarContext';
import { logout } from '../api';
import UserAvatar from './UserAvatar';

function Sidebar({ user: initialUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(initialUser);
  const { isCollapsed, setIsCollapsed } = useSidebarCollapsed();

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const handleUserUpdate = (event) => {
      if (event.detail) {
        setUser(event.detail);
      }
    };

    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/transactions', label: 'Transactions', icon: CreditCard },
    { path: '/budget', label: 'Budget', icon: Wallet },
    { path: '/savings', label: 'Savings', icon: Landmark },
    { path: '/shopping', label: 'Shopping', icon: ShoppingCart },
    { path: '/goals', label: 'Savings Goals', icon: Target },
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

  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount || 0);
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
        className={`fixed left-0 top-0 h-screen transition-all duration-500 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isDark
            ? 'bg-[#0a0e27] border-slate-800 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.5)]'
            : 'bg-white border-slate-200 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)]'
        } border-r flex flex-col ${
          isCollapsed ? 'w-24' : 'w-72'
        }`}
      >
        {/* Header with Collapse Button */}
        <div
          className={`h-20 flex items-center px-6 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'
            }`}>
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            {!isCollapsed && (
              <span className={`font-black text-lg tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                FINANCE<span className="text-amber-500">FT</span>
              </span>
            )}
          </div>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-xl transition-all duration-300 hidden md:block ${
              isDark
                ? 'hover:bg-slate-800 text-slate-500 hover:text-amber-400'
                : 'hover:bg-slate-50 text-slate-400 hover:text-amber-600'
            }`}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* User Profile Section */}
        {!isCollapsed && (
          <div className={`p-8 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} group cursor-pointer`}>
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div className="absolute inset-0 bg-amber-500 blur-[20px] opacity-20 group-hover:opacity-40 transition-opacity" />
              {user && <UserAvatar user={user} size="w-24 h-24 ring-4 ring-amber-500/10" />}
            </div>
            <div className="text-center">
              <p className={`font-black text-lg tracking-tight leading-none mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {getUserName()}
              </p>
              
              {/* Available Balance Section */}
              <div className={`mt-3 mb-2 py-2 px-4 rounded-2xl inline-block ${
                isDark ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-amber-50/50 border border-amber-100'
              }`}>
                <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 ${isDark ? 'text-amber-500/50' : 'text-amber-600/50'}`}>
                  Liquid Cash
                </p>
                <p className={`text-base font-black tracking-tight ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  {formatCurrency(user?.available_balance)}
                </p>
              </div>

              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {user?.email?.split('@')[0]}
              </p>
            </div>
          </div>
        )}

        {/* Collapsed User Avatar */}
        {isCollapsed && user && (
          <div className={`p-6 flex flex-col items-center border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <UserAvatar user={user} size="w-12 h-12 ring-2 ring-amber-500/10" />
            <div className={`mt-2 text-[10px] font-black ${isDark ? 'text-amber-400' : 'text-amber-600'} text-center truncate w-full`}>
              {formatCurrency(user?.available_balance)}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : ''}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                  active
                    ? 'bg-amber-500 shadow-lg shadow-amber-500/20 text-white'
                    : isDark
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                  active ? 'scale-110' : 'group-hover:scale-110'
                }`} />
                {!isCollapsed && (
                  <span className={`text-sm font-black uppercase tracking-[0.2em] ${
                    active ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
                  }`}>
                    {item.label}
                  </span>
                )}
                {active && !isCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className={`p-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-3`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
              isDark
                ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-amber-400'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-amber-600'
            }`}
          >
            {isDark ? (
              <Sun className="w-5 h-5 flex-shrink-0 group-hover:rotate-90 transition-transform duration-500" />
            ) : (
              <Moon className="w-5 h-5 flex-shrink-0 group-hover:-rotate-12 transition-transform duration-500" />
            )}
            {!isCollapsed && <span className="text-sm font-black uppercase tracking-[0.2em]">Theme</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
              isDark
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            {!isCollapsed && <span className="text-sm font-black uppercase tracking-[0.2em]">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
