/**
 * Main App Component - Fixed routing
 */
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import { isAuthenticated, logout, getCurrentUser } from './api';

// Import pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Landing from "./pages/Landing";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - Landing page for all non-authenticated users */}
        <Route path="/" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budget" element={<Budget />} />
        </Route>

        {/* Catch all - show landing page if not authenticated, else dashboard */}
        <Route path="*" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Landing />} />
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

  useEffect(() => {
    // Get current user info
    getCurrentUser()
      .then(setUser)
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Navigation Bar - Dark Theme */}
      <nav className="bg-slate-900/80 backdrop-blur-md shadow-lg border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-400/20 rounded-lg flex items-center justify-center border border-amber-400/30">
                <span className="text-xl">💼</span>
              </div>
              <span className="font-bold text-xl text-white">Finance Tracker</span>
            </div>

            {/* Navigation Links */}
            <div className="flex gap-6">
              <Link 
                to="/dashboard" 
                className="text-slate-300 hover:text-amber-400 font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                to="/transactions" 
                className="text-slate-300 hover:text-amber-400 font-medium transition-colors"
              >
                Transactions
              </Link>
              <Link
                to="/budget"
                className="text-slate-300 hover:text-amber-400 font-medium transition-colors"
              >
                Budget
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                {user?.username || 'User'}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Full width for dashboard sections */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default App;