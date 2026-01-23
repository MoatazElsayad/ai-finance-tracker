/**
 * Main App Component - Fixed routing
 */
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated, logout, getCurrentUser } from './api';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SidebarProvider, useSidebarCollapsed } from './context/SidebarContext';
import UserAvatar from './components/UserAvatar';
import { Sun, Moon, ScanLine, CirclePlus } from 'lucide-react';

// Import pages and components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Landing from "./pages/Landing";
import Profile from './pages/Profile';
import ReceiptUpload from './pages/ReceiptUpload';
import About from './pages/About';
import Sidebar from './components/Sidebar';

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

  useEffect(() => {
    // Get current user info
    getCurrentUser()
      .then(setUser)
      .catch(console.error);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}>
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Overlay Backdrop - Dims content when sidebar is open on mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30 transition-opacity duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Navigation Bar */}
      <nav className={`${isDark ? 'bg-slate-900/80' : 'bg-white/80'} backdrop-blur-md shadow-lg ${isDark ? 'border-slate-700' : 'border-slate-200'} border-b sticky top-0 z-40 transition-all duration-300 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        <div className="px-4 md:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-gradient-to-br from-amber-400/30 to-amber-500/30 border border-amber-400/40' : 'bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300'
              }`}>
                <span className={`${isDark ? 'text-slate-900' : 'text-amber-700'} font-bold`}>FT</span>
              </div>
              <span className={`font-bold text-lg md:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>Finance Tracker</span>
            </div>

            {/* Navigation Links - Hidden on Mobile */}
            <div className="hidden md:flex gap-6">
              <Link 
                to="/dashboard" 
                className={`${isDark ? 'text-slate-300 hover:text-amber-400' : 'text-slate-600 hover:text-amber-600'} font-medium transition-colors`}
              >
                Dashboard
              </Link>
              <Link 
                to="/transactions" 
                className={`${isDark ? 'text-slate-300 hover:text-amber-400' : 'text-slate-600 hover:text-amber-600'} font-medium transition-colors`}
              >
                Transactions
              </Link>
              <Link 
                to="/budget"
                className={`${isDark ? 'text-slate-300 hover:text-amber-400' : 'text-slate-600 hover:text-amber-600'} font-medium transition-colors`}
              >
                Budget
              </Link>
              <Link 
                to="/about"
                className={`${isDark ? 'text-slate-300 hover:text-amber-400' : 'text-slate-600 hover:text-amber-600'} font-medium transition-colors`}
              >
                About
              </Link>
            </div>

            {/* User Info - Show on Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/receipt-upload"
                state={{ fromNavbarScan: true }}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                  isDark ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                } transition-colors border ${isDark ? 'border-slate-700' : 'border-slate-300'}`}
              >
                <ScanLine className="w-5 h-5" />
                <span className="text-sm font-semibold">Scan</span>
              </Link>
              <Link
                to="/transactions"
                state={{ openForm: true }}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                  isDark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                } transition-colors border ${isDark ? 'border-amber-400/40' : 'border-amber-300'}`}
              >
                <CirclePlus className="w-5 h-5" />
                <span className="text-sm font-semibold">Add</span>
              </Link>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${
                  isDark ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                } transition-colors border ${isDark ? 'border-slate-700' : 'border-slate-300'}`}
                title={isDark ? 'Light Mode' : 'Dark Mode'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {user && <UserAvatar user={user} size="w-10 h-10" />}
              <div className="flex flex-col">
                <span className={`text-sm font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  {user?.first_name || user?.username || 'User'}
                </span>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {user?.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} min-h-screen ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
