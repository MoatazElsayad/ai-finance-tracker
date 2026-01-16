/**
 * Cache Utilities for AI Insights
 * Centralized functions for managing localStorage cache for AI budget insights.
 */

// Helper to create a unique cache key based on relevant data
export const getCacheKey = (budgets, transactions, selectedMonth) => {
  const budgetString = JSON.stringify(budgets.map(b => ({
    id: b.id,
    category_id: b.category_id,
    amount: b.amount,
    month: selectedMonth.month,
    year: selectedMonth.year
  })).sort((a, b) => a.id - b.id));

  const transactionString = JSON.stringify(transactions
    .filter(t => {
      const txnDate = new Date(t.date);
      return txnDate.getFullYear() === selectedMonth.year &&
             txnDate.getMonth() + 1 === selectedMonth.month &&
             t.amount < 0; // Only expense transactions affect budget insights
    })
    .map(t => ({
      id: t.id,
      amount: t.amount,
      category_id: t.category_id,
      date: t.date // Include date for finer granularity if needed
    }))
    .sort((a, b) => a.id - b.id));

  return btoa(budgetString + transactionString).slice(0, 32); // Base64 encode and truncate for brevity
};

// Clears all AI insights from localStorage
export const clearInsightsCache = () => {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('budget_insights_'));
    keys.forEach(key => localStorage.removeItem(key));
    console.log('🗑️ Cleared AI insights cache');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Loads cached insights for a given key
export const loadCachedInsights = (cacheKey) => {
  try {
    const cached = localStorage.getItem(`budget_insights_${cacheKey}`);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      console.log('📋 Loaded cached AI insights for key:', cacheKey);
      return parsedCache;
    }
  } catch (error) {
    console.error('Error loading cached insights:', error);
  }
  return null;
};

// Saves insights to cache for a given key
export const saveInsightsToCache = (cacheKey, insights, model, selectedMonth) => {
  try {
    const cacheData = {
      insights,
      model,
      timestamp: Date.now(),
      month: selectedMonth.month,
      year: selectedMonth.year
    };
    localStorage.setItem(`budget_insights_${cacheKey}`, JSON.stringify(cacheData));
    console.log('💾 Saved AI insights to cache for key:', cacheKey);
  } catch (error) {
    console.error('Error saving insights to cache:', error);
  }
};
