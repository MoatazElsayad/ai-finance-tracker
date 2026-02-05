/**
 * API Client - Fixed & Robust Version
 */

// Change this line in your api.js
const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8001' : '/api');

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
  
  // Use Authorization header (preferred) and fallback to query param for backward compatibility
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  
  // For backward compatibility, also add token to query if not already present
  let finalUrl = url;
  if (token && !url.includes('token=')) {
    const separator = url.includes('?') ? '&' : '?';
    finalUrl = `${url}${separator}token=${encodeURIComponent(token)}`;
  }
  
  const response = await fetch(`${API_URL}${finalUrl}`, {
    ...options,
    headers,
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
  const response = await authFetch(`/auth/me`);
  return handleResponse(response);
};

// ============================================
// TRANSACTIONS
// ============================================

export const getTransactions = async (page = 1, limit = 50) => {
  const response = await authFetch(`/transactions?page=${page}&limit=${limit}`);
  const data = await handleResponse(response);
  // Handle both old format (array) and new format (object with pagination)
  if (Array.isArray(data)) {
    return { transactions: data, pagination: { page: 1, limit: data.length, total: data.length, pages: 1 } };
  }
  return data;
};

export const createTransaction = async (categoryId, amount, description, date) => {
  try {
    const response = await authFetch(`/transactions`, {
      method: 'POST',
      body: JSON.stringify({
        category_id: categoryId,
        amount: parseFloat(amount),
        description: description || '',
        date,
      }),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw new Error(error.message || 'Failed to create transaction. Please try again.');
  }
};

export const deleteTransaction = async (id) => {
  try {
    const response = await authFetch(`/transactions/${id}`, {
      method: 'DELETE',
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw new Error(error.message || 'Failed to delete transaction. Please try again.');
  }
};

// ============================================
// CATEGORIES
// ============================================

export const getCategories = async () => {
  try {
    const response = await authFetch(`/categories`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error(error.message || 'Failed to load categories. Please try again.');
  }
};

export const createCategory = async (name, type, icon) => {
  try {
    const response = await authFetch(`/categories`, {
      method: 'POST',
      body: JSON.stringify({
        name: (name || '').trim(),
        type,
        icon: icon || '📦'
      }),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error creating category:', error);
    throw new Error(error.message || 'Failed to create category. Please try again.');
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    const response = await authFetch(`/categories/${categoryId}`, {
      method: 'DELETE',
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw new Error(error.message || 'Failed to delete category. Please try again.');
  }
};

export const initSavingsCategory = async () => {
  try {
    const response = await authFetch(`/categories/init-savings`, {
      method: 'POST',
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error initializing savings category:', error);
    throw new Error(error.message || 'Failed to initialize savings category. Please try again.');
  }
};

// ============================================
// ANALYTICS
// ============================================

export const getMonthlyAnalytics = async (year, month) => {
  try {
    const response = await authFetch(`/analytics/monthly?year=${year}&month=${month}`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw new Error(error.message || 'Failed to load analytics. Please try again.');
  }
};

// ============================================
// GOALS
// ============================================

export const getGoals = async () => {
  try {
    const response = await authFetch(`/goals`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw new Error(error.message || 'Failed to load goals. Please try again.');
  }
};

export const createGoal = async (goalData) => {
  try {
    const response = await authFetch(`/goals`, {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error creating goal:', error);
    throw new Error(error.message || 'Failed to create goal. Please try again.');
  }
};

export const updateGoal = async (goalId, goalData) => {
  try {
    const response = await authFetch(`/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(goalData),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error updating goal:', error);
    throw new Error(error.message || 'Failed to update goal. Please try again.');
  }
};

export const deleteGoal = async (goalId) => {
  try {
    const response = await authFetch(`/goals/${goalId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw new Error(error.message || 'Failed to delete goal. Please try again.');
  }
};

// ============================================
// BUDGETS
// ============================================

export const getBudgets = async (year, month) => {
  try {
    const response = await authFetch(`/budgets?year=${year}&month=${month}`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    throw new Error(error.message || 'Failed to load budgets. Please try again.');
  }
};

export const copyLastMonthBudgets = async (year, month) => {
  try {
    const response = await authFetch(`/budgets/copy-last-month?year=${year}&month=${month}`, {
      method: 'POST',
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error copying budgets:', error);
    throw new Error(error.message || 'Failed to copy budgets. Please try again.');
  }
};

export const createBudget = async (categoryId, amount, month, year) => {
  try {
    const response = await authFetch(`/budgets`, {
      method: 'POST',
      body: JSON.stringify({
        category_id: categoryId,
        amount: parseFloat(amount),
        month: parseInt(month),
        year: parseInt(year),
      }),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error creating budget:', error);
    throw new Error(error.message || 'Failed to create budget. Please try again.');
  }
};

export const updateBudget = async (budgetId, categoryId, amount, month, year) => {
  try {
    const response = await authFetch(`/budgets/${budgetId}`, {
      method: 'PUT',
      body: JSON.stringify({
        category_id: categoryId,
        amount: parseFloat(amount),
        month: parseInt(month),
        year: parseInt(year),
      }),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error updating budget:', error);
    throw new Error(error.message || 'Failed to update budget. Please try again.');
  }
};

export const deleteBudget = async (budgetId) => {
  try {
    const response = await authFetch(`/budgets/${budgetId}`, {
      method: 'DELETE',
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw new Error(error.message || 'Failed to delete budget. Please try again.');
  }
};

export const getBudgetComparison = async (year, month) => {
  try {
    const response = await authFetch(`/budgets/comparison?year=${year}&month=${month}`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching budget comparison:', error);
    throw new Error(error.message || 'Failed to load budget comparison. Please try again.');
  }
};

export const generateReport = async ({ startDate, endDate, format = 'pdf' }) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/reports/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
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
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error(error.message || 'Failed to generate report. Please try again.');
  }
};
// ============================================
// AI
// ============================================

export const generateAISummary = async (year, month) => {
  try {
    const response = await authFetch(`/ai/summary?year=${year}&month=${month}`, {
      method: 'POST',
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error generating AI summary:', error);
    throw new Error(error.message || 'Failed to generate AI summary. Please try again.');
  }
};

// Simple chat-style question using the summary endpoint as a fallback
export const askAIQuestion = async (year, month, question) => {
  try {
    const response = await authFetch(`/ai/chat?year=${year}&month=${month}`, {
      method: 'POST',
      body: JSON.stringify({ question: (question || '').trim() }),
    });
    const data = await handleResponse(response);
    return {
      answer: data?.answer || 'No answer available.',
      model_used: data?.model_used || null,
    };
  } catch (error) {
    console.error('Error asking AI question:', error);
    throw new Error(error.message || 'Failed to get AI response. Please try again.');
  }
};

// ============================================
// SAVINGS & INVESTMENTS
// ============================================

export const getSavingsData = async () => {
  try {
    const response = await authFetch(`/savings`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching savings data:', error);
    throw new Error(error.message || 'Failed to load savings data. Please try again.');
  }
};

export const getSavingsRates = async (force = false) => {
  try {
    const response = await fetch(`${API_URL}/savings/rates${force ? '?force=true' : ''}`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching savings rates:', error);
    throw new Error(error.message || 'Failed to load market rates. Please try again.');
  }
};

export const createInvestment = async (investmentData) => {
  try {
    const response = await authFetch(`/investments`, {
      method: 'POST',
      body: JSON.stringify(investmentData),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error creating investment:', error);
    throw new Error(error.message || 'Failed to create investment. Please try again.');
  }
};

export const deleteInvestment = async (investmentId) => {
  try {
    const response = await authFetch(`/investments/${investmentId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error deleting investment:', error);
    throw new Error(error.message || 'Failed to delete investment. Please try again.');
  }
};

export const updateSavingsGoal = async (monthlyGoal) => {
  try {
    const response = await authFetch(`/users/me/savings-goal`, {
      method: 'PATCH',
      body: JSON.stringify({ monthly_goal: parseFloat(monthlyGoal) }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error updating savings goal:', error);
    throw new Error(error.message || 'Failed to update savings goal. Please try again.');
  }
};

export const setLongTermSavingsGoal = async (targetAmount, targetDate) => {
  try {
    const response = await authFetch(`/savings/long-term-goal`, {
      method: 'POST',
      body: JSON.stringify({ 
        target_amount: parseFloat(targetAmount), 
        target_date: targetDate 
      }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error setting long-term savings goal:', error);
    throw new Error(error.message || 'Failed to set long-term savings goal. Please try again.');
  }
};

// ============================================
// User Profile
// ============================================

// Server-Sent Events endpoint for real-time AI model progress
export const createAIProgressStream = (year, month, onMessage, onError) => {
  const token = getToken();
  const url = `${API_URL}/ai/progress?year=${year}&month=${month}${token ? `&token=${token}` : ''}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing SSE message:', error);
      if (onError) onError(error);
    }
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
  const url = `${API_URL}/ai/chat_progress?year=${year}&month=${month}&question=${encodeURIComponent(question)}${token ? `&token=${token}` : ''}`;
  const es = new EventSource(url);
  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing SSE message:', error);
      if (onError) onError(error);
    }
  };
  es.onerror = (error) => {
    if (onError) onError(error);
    es.close();
  };
  return es;
};

// Update profile
export const updateUserProfile = async (data) => {
  try {
    const response = await authFetch(`/profile`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error(error.message || 'Failed to update profile. Please try again.');
  }
};

// ============================================
// AUTH HELPER
// ============================================

export const isAuthenticated = () => {
  return !!getToken();
};
