/**
 * Main App Component - Fixed routing
 */
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated, logout, getCurrentUser, getTransactions } from './api';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SidebarProvider, useSidebarCollapsed } from './context/SidebarContext';
import UserAvatar from './components/UserAvatar';
import { Sun, Moon, ScanLine, CirclePlus } from 'lucide-react';

// Import pages and components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Landing from "./pages/Landing";
import Profile from './pages/Profile';
import ReceiptUpload from './pages/ReceiptUpload';
import Savings from './pages/Savings';
import About from './pages/About';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public routes – redirect to dashboard if already logged in */}
        <Route
          path="/"
          element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Landing />}
        />
        <Route
          path="/login"
          element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />} 
        />

        {/* All protected routes wrapped in Layout + auth guard */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/receipt-upload" element={<ReceiptUpload />} />
          <Route path="/about" element={<About />} />
        </Route>

        {/* Catch-all */}
        <Route
          path="*"
          element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Landing />}
        />
      </Routes>
    </BrowserRouter>
  );
}

// Protected Route - redirects to login if not authenticated
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Layout with navigation
function Layout() {
  const [user, setUser] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, setIsCollapsed } = useSidebarCollapsed();
  const location = useLocation();

  useEffect(() => {
    // Get current user info and calculate balance
    const loadUserData = async () => {
      try {
        const [userData, transactionsData] = await Promise.all([
          getCurrentUser(),
          getTransactions()
        ]);

        if (userData && transactionsData) {
          // Calculate Available Balance (Net Savings)
          const totalIncome = transactionsData
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
          const totalOutflow = Math.abs(
            transactionsData
              .filter(t => t.amount < 0)
              .reduce((sum, t) => sum + t.amount, 0)
          );
          const totalSavingsTx = transactionsData
              .filter(t => t.category_name && t.category_name.toLowerCase().includes('savings'))
              .reduce((sum, t) => sum + (-t.amount), 0);
          const actualSpending = totalOutflow - totalSavingsTx;
          const netSavings = totalIncome - actualSpending;

          setUser({
            ...userData,
            available_balance: netSavings
          });
        } else if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user data in layout:', error);
      }
    };

    if (isAuthenticated()) {
      loadUserData();
    }
  }, [location.pathname]); // Re-calculate on route change to keep it fresh

  const isDark = theme === 'dark';

  return (
    <div className={`${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'} transition-colors duration-500 min-h-screen`}>
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Overlay Backdrop - Dims content when sidebar is open on mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-30 transition-all duration-500"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Navigation Bar */}
      <nav className={`${isDark ? 'bg-[#0a0e27]/80' : 'bg-white/80'} backdrop-blur-md shadow-2xl shadow-black/5 ${isDark ? 'border-slate-800' : 'border-slate-200'} border-b sticky top-0 z-40 transition-all duration-500 ${
      isCollapsed ? 'md:ml-24' : 'md:ml-72'
    }`}>
        <div className="px-4 md:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 ${
                isDark 
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40' 
                  : 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40'
              }`}>
                <span className="text-white font-black text-xl tracking-tighter">FT</span>
              </div>
              <div className="flex flex-col">
                <span className={`font-black text-xl tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Finance <span className="text-amber-500">Tracker</span>
                </span>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Intelligence
                </span>
              </div>
            </div>

            {/* Navigation Links - Hidden on Mobile */}
            <div className="hidden lg:flex gap-8">
              {[
                { to: '/dashboard', label: 'Dashboard' },
            { to: '/transactions', label: 'Transactions' },
            { to: '/budget', label: 'Budget' },
            { to: '/savings', label: 'Savings' }
          ].map((item) => (
                <Link 
                  key={item.to}
                  to={item.to} 
                  className={`text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                    location.pathname === item.to
                      ? 'text-amber-500'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Actions - Show on Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/receipt-upload"
                state={{ fromNavbarScan: true }}
                className={`p-3 rounded-2xl flex items-center gap-2 transition-all duration-300 ${
                  isDark 
                    ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border-slate-200'
                } border shadow-sm group`}
                title="Scan Receipt"
              >
                <ScanLine className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>
              
              <Link
                to="/transactions"
                state={{ openForm: true }}
                className={`p-3 rounded-2xl flex items-center gap-2 transition-all duration-300 ${
                  isDark 
                    ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30' 
                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200'
                } border shadow-sm group`}
                title="Add Transaction"
              >
                <CirclePlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>

              <div className={`w-px h-8 mx-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

              <button
                onClick={toggleTheme}
                className={`p-3 rounded-2xl transition-all duration-300 ${
                  isDark 
                    ? 'bg-slate-800/50 text-amber-400 hover:bg-slate-700 border-slate-700' 
                    : 'bg-slate-100 text-amber-600 hover:bg-slate-200 border-slate-200'
                } border shadow-sm group`}
                title={isDark ? 'Light Mode' : 'Dark Mode'}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                ) : (
                  <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-500" />
                )}
              </button>

              {user && (
                <div className="flex items-center gap-3 pl-2">
                  <UserAvatar user={user} size="w-10 h-10 ring-2 ring-amber-500/20" />
                  <div className="flex flex-col">
                    <span className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {user?.first_name || user?.username || 'User'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {user?.email?.split('@')[0]}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'} border border-amber-500/20`}>
                        {(user?.available_balance || 0).toLocaleString('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`transition-all duration-500 ${isCollapsed ? 'md:ml-24' : 'md:ml-72'} min-h-screen flex flex-col ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
        <div className="animate-in fade-in duration-700 flex-grow">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
}

export default App;
