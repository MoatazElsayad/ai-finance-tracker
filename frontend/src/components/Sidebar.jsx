/**
 * Sidebar Component - Navigation with sophisticated modern aesthetic
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Moon, Sun, LogOut, BarChart3, CreditCard, Wallet, 
  User, ChevronLeft, ChevronRight, ImagePlus, Info, Target, 
  Landmark, ShoppingCart, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useSidebarCollapsed } from '../context/SidebarContext';
import { logout } from '../api';
import UserAvatar from './UserAvatar';

function Sidebar({ user: initialUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(initialUser);
  const { isCollapsed, setIsCollapsed } = useSidebarCollapsed();
  // Manage open states for collapsible sections (all open by default)
  const [openSections, setOpenSections] = useState({
    'Overview': true,
    'Finance': true,
    'Account': true
  });

  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const handleUserUpdate = (event) => {
      if (event.detail) setUser(event.detail);
    };
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
      ]
    },
    {
      title: 'Finance',
      items: [
        { path: '/transactions', label: 'Transactions', icon: CreditCard },
        { path: '/budget', label: 'Budget', icon: Wallet },
        { path: '/savings', label: 'Savings', icon: Landmark },
        { path: '/shopping', label: 'Shopping', icon: ShoppingCart },
        { path: '/goals', label: 'Savings Goals', icon: Target },
        { path: '/receipt-upload', label: 'Receipt Upload', icon: ImagePlus },
      ]
    },
    {
      title: 'Account',
      items: [
        { path: '/profile', label: 'Profile', icon: User },
        { path: '/about', label: 'About', icon: Info },
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Common styles
  const sidebarBaseClasses = `fixed left-0 top-0 h-screen transition-all duration-500 ease-in-out z-40 border-r flex flex-col font-sans ${
    isDark
      ? 'bg-gradient-to-b from-[#0f172a] to-[#0a0e27] border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.5)]'
      : 'bg-gradient-to-b from-white to-slate-50 border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
  }`;
  
  // Width handling: 
  // Mobile: full width (w-full) or hidden (-translate-x-full)
  // Desktop: w-60 (expanded) or w-20 (collapsed)
  const widthClasses = isOpen 
    ? 'w-full md:w-60 translate-x-0' // Mobile open
    : `w-60 md:w-20 -translate-x-full md:translate-x-0 ${!isCollapsed ? 'md:!w-60' : ''}`;

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-50 p-2 rounded-lg transition-all duration-300 md:hidden ${
          isDark
            ? 'bg-slate-800/90 text-amber-400 backdrop-blur-md border border-slate-700'
            : 'bg-white/90 text-amber-600 backdrop-blur-md border border-slate-200 shadow-sm'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Container */}
      <aside className={`${sidebarBaseClasses} ${widthClasses}`}>
        {/* Header */}
        <div className={`h-20 flex items-center justify-between px-5 border-b shrink-0 ${
          isDark ? 'border-slate-800/50' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20' 
                : 'bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100'
            }`}>
              <Target className="w-6 h-6 text-amber-500" strokeWidth={2.5} />
            </div>
            
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col"
                >
                  <span className={`font-black text-lg tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    FINANCE<span className="text-amber-500">FT</span>
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Pro Edition
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex p-1.5 rounded-lg transition-all duration-300 ${
              isDark
                ? 'hover:bg-slate-800 text-slate-500 hover:text-amber-400'
                : 'hover:bg-slate-100 text-slate-400 hover:text-amber-600'
            }`}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Profile - Compact or Full */}
        <div className={`relative transition-all duration-300 ${
          isCollapsed ? 'p-4' : 'p-6'
        } border-b ${isDark ? 'border-slate-800/50' : 'border-slate-100'}`}>
          <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="relative shrink-0">
              <UserAvatar 
                user={user} 
                size={isCollapsed ? "w-10 h-10" : "w-12 h-12"} 
                className={`ring-2 ${isDark ? 'ring-slate-700' : 'ring-white shadow-md'}`}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {user?.first_name || 'User'} {user?.last_name || ''}
                </h3>
                <p className={`text-xs truncate mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {user?.email}
                </p>
                <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {formatCurrency(user?.available_balance)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-4 space-y-6">
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} className="relative">
              {/* Group Title - Only visible when expanded */}
              {!isCollapsed && (
                <button
                  onClick={() => toggleSection(group.title)}
                  className={`w-full flex items-center justify-between px-2 mb-2 text-xs font-bold uppercase tracking-wider transition-colors group ${
                    isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {group.title}
                  <ChevronDown 
                    className={`w-3 h-3 transition-transform duration-300 ${
                      openSections[group.title] ? 'rotate-0' : '-rotate-90'
                    }`} 
                  />
                </button>
              )}

              {/* Collapsed Group Divider */}
              {isCollapsed && groupIdx > 0 && (
                <div className={`my-3 mx-2 h-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              )}

              {/* Group Items */}
              <AnimatePresence initial={false}>
                {(isCollapsed || openSections[group.title]) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)} // Close mobile menu on click
                            className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                              active
                                ? isDark 
                                  ? 'bg-gradient-to-r from-amber-500/10 to-transparent text-amber-400' 
                                  : 'bg-gradient-to-r from-amber-50 to-transparent text-amber-600'
                                : isDark
                                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            {/* Active Indicator Border */}
                            {active && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-amber-500"
                              />
                            )}

                            <Icon 
                              className={`w-6 h-6 shrink-0 transition-transform duration-300 ${
                                active ? 'scale-110' : 'group-hover:scale-110'
                              }`} 
                              strokeWidth={2}
                            />
                            
                            {!isCollapsed && (
                              <span className={`text-sm font-medium tracking-wide whitespace-nowrap transition-opacity duration-300 ${
                                active ? 'font-semibold' : ''
                              }`}>
                                {item.label}
                              </span>
                            )}
                            
                            {/* Tooltip for collapsed state */}
                            {isCollapsed && (
                              <div className={`absolute left-full ml-4 px-2 py-1 rounded bg-slate-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl ${
                                isDark ? 'bg-slate-800' : 'bg-slate-900'
                              }`}>
                                {item.label}
                                <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-slate-900" />
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t space-y-2 shrink-0 ${isDark ? 'border-slate-800/50' : 'border-slate-100'}`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
              isDark
                ? 'hover:bg-slate-800 text-slate-400 hover:text-amber-400'
                : 'hover:bg-slate-100 text-slate-500 hover:text-amber-600'
            }`}
          >
            {isDark ? (
              <Sun className="w-6 h-6 shrink-0 group-hover:rotate-90 transition-transform duration-500" strokeWidth={2} />
            ) : (
              <Moon className="w-6 h-6 shrink-0 group-hover:-rotate-12 transition-transform duration-500" strokeWidth={2} />
            )}
            {!isCollapsed && <span className="text-sm font-medium">Theme Mode</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
              isDark
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut className="w-6 h-6 shrink-0 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
            {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default Sidebar;
