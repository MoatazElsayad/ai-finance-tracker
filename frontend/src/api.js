/**
 * API Client - Fixed & Robust Version
 */

// Change this line in your api.js
const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api');

// Helper function to get auth token from localStorage
const getToken = () => localStorage.getItem('token');

/**
 * HELPER: Safely parse JSON or return a generic error
 * This prevents the "Unexpected end of JSON input" crash
 */
const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type");
  
  if (!response.ok) {
    // If the server sent a JSON error (like FastAPI's {detail: "..."})
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error: ${response.status}`);
    }
    // If the server sent HTML (404) or nothing
    throw new Error(`Server Error: ${response.status} ${response.statusText}`);
  }

  // If successful, check if there is actual content to parse
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }
  return null; 
};

// Helper function to make authenticated requests
const authFetch = async (url, options = {}) => {
  const token = getToken();
  
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // If unauthorized, redirect to login
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
};

// ============================================
// AUTHENTICATION
// ============================================

export const register = async (email, username, firstName, lastName, phone, gender, password) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, first_name: firstName, last_name: lastName, phone, gender, password }),
  });

  const data = await handleResponse(response);
  if (data && data.access_token) {
    localStorage.setItem('token', data.access_token);
  }
  return data;
};

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse(response);
  if (data && data.access_token) {
    localStorage.setItem('token', data.access_token);
  }
  return data;
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

export const getCurrentUser = async () => {
  const token = getToken();
  const response = await authFetch(`/auth/me?token=${token}`);
  return handleResponse(response);
};

// ============================================
// TRANSACTIONS
// ============================================

export const getTransactions = async () => {
  const token = getToken();
  const response = await authFetch(`/transactions?token=${token}`);
  return handleResponse(response);
};

export const createTransaction = async (categoryId, amount, description, date) => {
  const token = getToken();
  const response = await authFetch(`/transactions?token=${token}`, {
    method: 'POST',
    body: JSON.stringify({
      category_id: categoryId,
      amount: parseFloat(amount),
      description,
      date,
    }),
  });

  return handleResponse(response);
};

export const deleteTransaction = async (id) => {
  const token = getToken();
  const response = await authFetch(`/transactions/${id}?token=${token}`, {
    method: 'DELETE',
  });

  return handleResponse(response);
};

// ============================================
// CATEGORIES
// ============================================

export const getCategories = async () => {
  const token = getToken();
  const response = await authFetch(`/categories?token=${token}`);
  return handleResponse(response);
};

export const createCategory = async (name, type, icon) => {
  const token = getToken();
  const response = await authFetch(`/categories?token=${token}`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      type,
      icon
    }),
  });

  return handleResponse(response);
};

export const deleteCategory = async (categoryId) => {
  const token = getToken();
  const response = await authFetch(`/categories/${categoryId}?token=${token}`, {
    method: 'DELETE',
  });

  return handleResponse(response);
};

export const initSavingsCategory = async () => {
  const token = getToken();
  const response = await authFetch(`/categories/init-savings?token=${token}`, {
    method: 'POST',
  });

  return handleResponse(response);
};

// ============================================
// ANALYTICS
// ============================================

export const getMonthlyAnalytics = async (year, month) => {
  const token = getToken();
  const response = await authFetch(`/analytics/monthly?year=${year}&month=${month}&token=${token}`);
  return handleResponse(response);
};

// ============================================
// GOALS
// ============================================

export const getGoals = async () => {
  const token = getToken();
  const response = await authFetch(`/goals?token=${token}`);
  return handleResponse(response);
};

export const createGoal = async (goalData) => {
  const token = getToken();
  const response = await authFetch(`/goals?token=${token}`, {
    method: 'POST',
    body: JSON.stringify(goalData),
  });
  return handleResponse(response);
};

export const updateGoal = async (goalId, goalData) => {
  const token = getToken();
  const response = await authFetch(`/goals/${goalId}?token=${token}`, {
    method: 'PUT',
    body: JSON.stringify(goalData),
  });
  return handleResponse(response);
};

export const deleteGoal = async (goalId) => {
  const token = getToken();
  const response = await authFetch(`/goals/${goalId}?token=${token}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

// ============================================
// BUDGETS
// ============================================

export const getBudgets = async (year, month) => {
  const token = getToken();
  const response = await authFetch(`/budgets?year=${year}&month=${month}&token=${token}`);
  return handleResponse(response);
};

export const copyLastMonthBudgets = async (year, month) => {
  const token = getToken();
  const response = await authFetch(`/budgets/copy-last-month?year=${year}&month=${month}&token=${token}`, {
    method: 'POST',
  });
  return handleResponse(response);
};

export const createBudget = async (categoryId, amount, month, year) => {
  const token = getToken();
  const response = await authFetch(`/budgets?token=${token}`, {
    method: 'POST',
    body: JSON.stringify({
      category_id: categoryId,
      amount: parseFloat(amount),
      month: parseInt(month),
      year: parseInt(year),
    }),
  });

  return handleResponse(response);
};

export const updateBudget = async (budgetId, categoryId, amount, month, year) => {
  const token = getToken();
  const response = await authFetch(`/budgets/${budgetId}?token=${token}`, {
    method: 'PUT',
    body: JSON.stringify({
      category_id: categoryId,
      amount: parseFloat(amount),
      month: parseInt(month),
      year: parseInt(year),
    }),
  });

  return handleResponse(response);
};

export const deleteBudget = async (budgetId) => {
  const token = getToken();
  const response = await authFetch(`/budgets/${budgetId}?token=${token}`, {
    method: 'DELETE',
  });

  return handleResponse(response);
};

export const getBudgetComparison = async (year, month) => {
  const token = getToken();
  const response = await authFetch(`/budgets/comparison?year=${year}&month=${month}&token=${token}`);
  return handleResponse(response);
};

export const generateReport = async ({ startDate, endDate, format = 'pdf' }) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/reports/generate?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start_date: startDate || null,
      end_date: endDate || null,
      format,
    }),
  });
  if (!response.ok) {
    const ct = response.headers.get('content-type');
    if (ct && ct.includes('application/json')) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to generate report');
    }
    throw new Error(`Server Error: ${response.status}`);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match ? match[1] : `report.${format}`;
  return { blob, filename };
};
// ============================================
// AI
// ============================================

export const generateAISummary = async (year, month) => {
  const token = getToken();
  const response = await authFetch(`/ai/summary?year=${year}&month=${month}&token=${token}`, {
    method: 'POST',
  });

  return handleResponse(response);
};

// Simple chat-style question using the summary endpoint as a fallback
export const askAIQuestion = async (year, month, question) => {
  const token = getToken();
  const response = await authFetch(`/ai/chat?year=${year}&month=${month}&token=${token}`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
  const data = await handleResponse(response);
  return {
    answer: data?.answer || 'No answer available.',
    model_used: data?.model_used || null,
  };
};

// ============================================
// SAVINGS & INVESTMENTS
// ============================================

export const getSavingsData = async () => {
  const token = getToken();
  const response = await authFetch(`/savings?token=${token}`);
  return handleResponse(response);
};

export const getSavingsRates = async () => {
  const response = await fetch(`${API_URL}/savings/rates`);
  return handleResponse(response);
};

export const createInvestment = async (investmentData) => {
  const token = getToken();
  const response = await authFetch(`/investments?token=${token}`, {
    method: 'POST',
    body: JSON.stringify(investmentData),
  });
  return handleResponse(response);
};

export const deleteInvestment = async (investmentId) => {
  const token = getToken();
  const response = await authFetch(`/investments/${investmentId}?token=${token}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

export const updateSavingsGoal = async (monthlyGoal) => {
  const token = getToken();
  const response = await authFetch(`/users/me/savings-goal?token=${token}`, {
    method: 'PATCH',
    body: JSON.stringify({ monthly_goal: parseFloat(monthlyGoal) }),
  });
  return handleResponse(response);
};

// ============================================
// User Profile
// ============================================

// Server-Sent Events endpoint for real-time AI model progress
export const createAIProgressStream = (year, month, onMessage, onError) => {
  const token = getToken();
  const eventSource = new EventSource(
    `${API_URL}/ai/progress?year=${year}&month=${month}&token=${token}`
  );

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  eventSource.onerror = (error) => {
    if (onError) onError(error);
    eventSource.close();
  };

  return eventSource; // Return EventSource so it can be closed
};

// Backwards-compatible wrapper name used in Dashboard.jsx
export const createAIChatProgressStream = (year, month, question, onMessage, onError) => {
  const token = getToken();
  const url = `${API_URL}/ai/chat_progress?year=${year}&month=${month}&question=${encodeURIComponent(question)}&token=${token}`;
  const es = new EventSource(url);
  es.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  es.onerror = (error) => {
    if (onError) onError(error);
    es.close();
  };
  return es;
};

// Update profile
export const updateUserProfile = async (data) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/profile?token=${token}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update profile');
  }
  return await res.json();
};

// ============================================
// AUTH HELPER
// ============================================

export const isAuthenticated = () => {
  return !!getToken();
};
