/**
 * API Client - Fixed & Robust Version
 */

// Change this line in your api.js
const API_URL = 'http://localhost:8000';

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

export const register = async (email, username, password) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
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
  const response = await fetch(`${API_URL}/categories`);
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
// AI
// ============================================

export const generateAISummary = async (year, month) => {
  const token = getToken();
  const response = await authFetch(`/ai/summary?year=${year}&month=${month}&token=${token}`, {
    method: 'POST',
  });

  return handleResponse(response);
};

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

// ============================================
// AUTH HELPER
// ============================================

export const isAuthenticated = () => {
  return !!getToken();
};