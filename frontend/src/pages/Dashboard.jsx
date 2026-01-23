/**
 * Dashboard - Dark Mode Finance Tracker
 * Professional financial dashboard with unified dark theme
 */
import { useState, useEffect } from 'react';
import { getTransactions, getMonthlyAnalytics, generateAISummary, getCurrentUser, askAIQuestion, createAIChatProgressStream, generateReport } from '../api';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, AreaChart, Area, ReferenceLine, Brush } from 'recharts';
import { RefreshCw, Sparkles, Bot, TrendingUp, TrendingDown, Wallet, Percent, LayoutDashboard, Scale, History, ArrowLeftRight } from 'lucide-react';

// Dark mode chart colors - professional finance palette with unified design
const CHART_COLORS = {
  // Primary metrics - high contrast, professional colors
  income: '#00d4aa',     // Bright emerald green
  expense: '#ff6b6b',    // Soft coral red
  savings: '#ffd93d',    // Bright golden yellow
  accent: '#4ecdc4',     // Teal accent

  // Unified category color palette - cohesive and visually appealing
  categories: [
    '#4ecdc4',  // Teal
    '#45b7d1',  // Sky blue
    '#96ceb4',  // Sage green
    '#ffeaa7',  // Cream yellow
    '#dda0dd',  // Plum
    '#98d8c8',  // Mint green
    '#f7dc6f',  // Golden yellow
    '#bb8fce',  // Light purple
    '#85c1e9',  // Light blue
    '#f8c471',  // Orange
    '#82e0aa',  // Light green
    '#f1948a',  // Light coral
    '#85c1e9',  // Powder blue
    '#d7bde2',  // Lavender
    '#a9dfbf',  // Pale green
  ],

  // Chart-specific colors for better visual hierarchy
  primary: '#00d4aa',    // Main positive color
  secondary: '#ff6b6b',  // Main negative color
  tertiary: '#ffd93d',   // Accent/highlight color
  neutral: '#64748b',    // Neutral gray for backgrounds
};

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiModelUsed, setAiModelUsed] = useState(null);
  const [currentTryingModel, setCurrentTryingModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState('summary'); // 'summary' | 'chat'
  const [chatQuestion, setChatQuestion] = useState('');
  const [aiChatAnswer, setAiChatAnswer] = useState('');
  const [chatModelUsed, setChatModelUsed] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatTryingModel, setChatTryingModel] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useState(false);
  const [chatWidgetMessages, setChatWidgetMessages] = useState([]);
  const [chatWidgetInput, setChatWidgetInput] = useState('');
  const [chatWidgetLoading, setChatWidgetLoading] = useState(false);
  const [chatWidgetTryingModel, setChatWidgetTryingModel] = useState(null);
  const [chatWidgetModelUsed, setChatWidgetModelUsed] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly', 'yearly', or 'overall'
  const { theme } = useTheme();
  const [reportLoading, setReportLoading] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [reportStatus, setReportStatus] = useState('Idle');

  useEffect(() => {
    loadDashboard();
  }, [selectedMonth, viewMode]);

  useEffect(() => {
    // Load user information
    const loadUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (aiMode === 'chat' && chatMessages.length === 0) {
      setChatMessages([{ role: 'assistant', text: 'Hi! How can I help you?' }]);
    }
  }, [aiMode]);

  useEffect(() => {
    if (isChatWidgetOpen && chatWidgetMessages.length === 0) {
      setChatWidgetMessages([{ role: 'assistant', text: 'Hi! How can I help you?' }]);
    }
  }, [isChatWidgetOpen]);

  // Get date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'monthly') {
      // Monthly: from 1st to last day of selected month
      const startDate = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
      const endDate = new Date(selectedMonth.year, selectedMonth.month, 0);
      return { startDate, endDate };
    } else if (viewMode === 'yearly') {
      // Yearly: entire year
      const startDate = new Date(selectedMonth.year, 0, 1);
      const endDate = new Date(selectedMonth.year, 11, 31);
      return { startDate, endDate };
    } else {
      // Overall: all time (very far past to future)
      return { startDate: new Date(1900, 0, 1), endDate: new Date(2100, 11, 31) };
    }
  };
  
  const handleDownloadReport = async (format = 'pdf') => {
    try {
      setReportLoading(true);
      setReportProgress(0);
      setReportStatus('Starting');
      const startTime = Date.now();
      let phase = 0;
      const phases = [
        { name: 'Preparing data', max: 25 },
        { name: 'Rendering charts', max: 50 },
        { name: 'Building report', max: 75 },
        { name: 'Downloading', max: 90 },
      ];
      const timer = setInterval(() => {
        phase = Math.min(phase, phases.length - 1);
        const target = phases[phase].max;
        setReportStatus(phases[phase].name);
        setReportProgress((p) => {
          const next = Math.min(target, p + Math.random() * 7);
          if (next >= target && phase < phases.length - 1) phase += 1;
          return Math.min(95, next);
        });
      }, 250);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to download reports.');
        clearInterval(timer);
        return;
      }
      const { startDate, endDate } = getDateRange();
      const payload = {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        format,
      };
      setReportStatus('Generating');
      const { blob, filename } = await generateReport(payload);
      setReportStatus('Finalizing');
      setReportProgress(98);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setReportStatus(`Done in ${elapsed}s`);
      setReportProgress(100);
      setTimeout(() => {
        setReportStatus('Idle');
        setReportProgress(0);
      }, 2000);
      clearInterval(timer);
    } catch (err) {
      alert(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  const handleWidgetAsk = async () => {
    if (!chatWidgetInput.trim()) return;
    setChatWidgetMessages(prev => [...prev, { role: 'user', text: chatWidgetInput }]);
    const question = chatWidgetInput;
    setChatWidgetInput('');
    setChatWidgetModelUsed(null);
    setChatWidgetLoading(true);
    setChatWidgetTryingModel(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      if (!token) {
        setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: 'Please log in again to use AI chat.' }]);
        setChatWidgetLoading(false);
        return;
      }

      const eventSourceUrl = `${apiUrl}/ai/chat_progress?year=${selectedMonth.year}&month=${selectedMonth.month}&question=${encodeURIComponent(question)}&token=${token}`;
      const eventSource = new EventSource(eventSourceUrl);
      let hasReceivedMessage = false;

      const timeout = setTimeout(() => {
        if (!hasReceivedMessage) {
          eventSource.close();
          fallbackToRegularChat();
        }
      }, 5000);

      const fallbackToRegularChat = async () => {
        try {
          const result = await askAIQuestion(selectedMonth.year, selectedMonth.month, question);
          setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: result.answer }]);
          setChatWidgetModelUsed(result.model_used || null);
        } catch {
          setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: 'Unable to connect to AI services. Please try again later.' }]);
        } finally {
          setChatWidgetLoading(false);
        }
      };

      eventSource.onmessage = (event) => {
        hasReceivedMessage = true;
        clearTimeout(timeout);
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'trying_model':
              setChatWidgetTryingModel(data.model);
              break;
            case 'success':
              setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
              setChatWidgetModelUsed(data.model);
              setChatWidgetLoading(false);
              eventSource.close();
              break;
            case 'error':
              setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: `All Models Busy\n\n${data.message}\n\nPlease try again in a few minutes.` }]);
              setChatWidgetLoading(false);
              eventSource.close();
              break;
          }
        } catch {}
      };

      eventSource.onerror = () => {
        clearTimeout(timeout);
        if (!hasReceivedMessage) {
          fallbackToRegularChat();
        } else {
          setChatWidgetLoading(false);
        }
        eventSource.close();
      };
    } catch {
      try {
        const result = await askAIQuestion(selectedMonth.year, selectedMonth.month, question);
        setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: result.answer }]);
        setChatWidgetModelUsed(result.model_used || null);
      } catch {
        setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: 'Unable to connect to AI services. Please try again later.' }]);
      } finally {
        setChatWidgetLoading(false);
      }
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const txns = await getTransactions();

      // Calculate analytics based on view mode
      let periodStart, periodEnd;
      if (viewMode === 'monthly') {
        periodStart = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
        periodEnd = new Date(selectedMonth.year, selectedMonth.month, 0);
      } else if (viewMode === 'yearly') {
        // Yearly view
        periodStart = new Date(selectedMonth.year, 0, 1);
        periodEnd = new Date(selectedMonth.year, 11, 31);
      } else {
        // Overall: all transactions
        periodStart = new Date(1900, 0, 1);
        periodEnd = new Date(2100, 11, 31);
      }

      // Filter transactions for the period
      const periodTransactions = txns.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= periodStart && txnDate <= periodEnd;
      });

      // Calculate totals
      const totalIncome = periodTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = Math.abs(
        periodTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0)
      );

      const netSavings = totalIncome - totalExpenses;
      const savingsRateValue = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0;

      // Get category breakdown for the period
      const categoryBreakdown = {};
      periodTransactions
        .filter(t => t.amount < 0)
        .forEach(t => {
          const category = t.category_name || 'Uncategorized';
          categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Math.abs(t.amount);
        });

      const categoryBreakdownArray = Object.entries(categoryBreakdown)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

      setTransactions(txns);
      setAnalytics({
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_savings: netSavings,
        savings_rate: savingsRateValue,
        category_breakdown: categoryBreakdownArray
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setAiSummary(''); // Clear previous summary
    setAiModelUsed(null); // Clear previous model
    setAiLoading(true);
    setCurrentTryingModel(null); // Reset trying model

    try {
      // Use Server-Sent Events for real-time progress
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('❌ No token found in localStorage');
        alert('Please log in again');
        setAiLoading(false);
        return;
      }

      const eventSourceUrl = `${apiUrl}/ai/progress?year=${selectedMonth.year}&month=${selectedMonth.month}&token=${token}`;

      console.log('🔗 Attempting SSE connection to:', eventSourceUrl);
      console.log('📝 Token exists:', !!token, 'Length:', token.length);

      const eventSource = new EventSource(eventSourceUrl);
      let hasReceivedMessage = false;

      // Timeout for SSE connection
      const timeout = setTimeout(() => {
        if (!hasReceivedMessage) {
          console.warn('SSE timeout, falling back to regular API');
          eventSource.close();
          fallbackToRegularAPI();
        }
      }, 5000); // 5 second timeout

      const fallbackToRegularAPI = async () => {
        try {
          console.log('Using fallback API call');
      const result = await generateAISummary(selectedMonth.year, selectedMonth.month);
          console.log('✅ Fallback API Response received:', result);
      setAiSummary(result.summary);
          setAiModelUsed(result.model_used || null);
        } catch (fallbackError) {
          console.error('Fallback API also failed:', fallbackError);
          alert(fallbackError.message);
        } finally {
          setAiLoading(false);
        }
      };

      eventSource.onmessage = (event) => {
        hasReceivedMessage = true;
        clearTimeout(timeout);

        console.log('SSE Message received:', event.data);
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'trying_model':
              console.log('Trying model:', data.model);
              setCurrentTryingModel(data.model);
              break;
            case 'model_failed':
              console.log(`Model ${data.model} failed: ${data.reason}`);
              // Could show failed models differently if needed
              break;
            case 'success':
              console.log('AI Success with model:', data.model);
              setAiSummary(data.summary);
              setAiModelUsed(data.model);
              setAiLoading(false);
              eventSource.close();
              break;
            case 'error':
              console.log('AI Error:', data.message);
              // Show "all models busy" message in the card instead of alert
              setAiSummary(`**All Models Busy**\n\n${data.message}\n\nPlease try again in a few minutes.`);
              setAiLoading(false);
              eventSource.close();
              break;
          }
        } catch (e) {
          console.error('Failed to parse SSE data:', event.data, e);
        }
      };

      eventSource.onopen = () => {
        console.log('SSE Connection opened');
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        console.error('SSE ReadyState:', eventSource.readyState);
        clearTimeout(timeout);
        if (!hasReceivedMessage) {
          console.warn('SSE failed on connection, using fallback');
          fallbackToRegularAPI();
        } else {
          setAiLoading(false);
        }
        eventSource.close();
      };

    } catch (error) {
      // Fallback to regular API call if SSE setup fails
      console.warn('SSE setup failed, falling back to regular API call');
      try {
        const result = await generateAISummary(selectedMonth.year, selectedMonth.month);
        console.log('✅ Fallback API Response received:', result);
        setAiSummary(result.summary);
        setAiModelUsed(result.model_used || null);
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
        // Show "all models busy" message in the card instead of alert
        setAiSummary(`**All Models Busy**\n\nUnable to connect to AI services. Please try again in a few minutes.`);
        setAiLoading(false);
        alert(fallbackError.message);
      } finally {
        setAiLoading(false);
      }
    }
  };

  const handleAskAI = async () => {
    if (!chatQuestion.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', text: chatQuestion }]);
    setChatQuestion('');
    setChatModelUsed(null);
    setChatLoading(true);
    setChatTryingModel(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again');
        setChatLoading(false);
        return;
      }

      const eventSourceUrl = `${apiUrl}/ai/chat_progress?year=${selectedMonth.year}&month=${selectedMonth.month}&question=${encodeURIComponent(chatQuestion)}&token=${token}`;
      const eventSource = new EventSource(eventSourceUrl);
      let hasReceivedMessage = false;

      const timeout = setTimeout(() => {
        if (!hasReceivedMessage) {
          eventSource.close();
          fallbackToRegularChat();
        }
      }, 5000);

      const fallbackToRegularChat = async () => {
        try {
          const result = await askAIQuestion(selectedMonth.year, selectedMonth.month, chatQuestion);
          setChatMessages(prev => [...prev, { role: 'assistant', text: result.answer }]);
          setChatModelUsed(result.model_used || null);
        } catch (err) {
          setChatMessages(prev => [...prev, { role: 'assistant', text: 'Unable to connect to AI services. Please try again later.' }]);
        } finally {
          setChatLoading(false);
        }
      };

      eventSource.onmessage = (event) => {
        hasReceivedMessage = true;
        clearTimeout(timeout);
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'trying_model':
              setChatTryingModel(data.model);
              break;
            case 'model_failed':
              break;
            case 'success':
              setChatMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
              setChatModelUsed(data.model);
              setChatLoading(false);
              eventSource.close();
              break;
            case 'error':
              setChatMessages(prev => [...prev, { role: 'assistant', text: `All Models Busy\n\n${data.message}\n\nPlease try again in a few minutes.` }]);
              setChatLoading(false);
              eventSource.close();
              break;
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        clearTimeout(timeout);
        if (!hasReceivedMessage) {
          fallbackToRegularChat();
        } else {
          setChatLoading(false);
        }
        eventSource.close();
      };
    } catch {
      try {
        const result = await askAIQuestion(selectedMonth.year, selectedMonth.month, chatQuestion);
        setChatMessages(prev => [...prev, { role: 'assistant', text: result.answer }]);
        setChatModelUsed(result.model_used || null);
      } catch {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Unable to connect to AI services. Please try again later.' }]);
      } finally {
        setChatLoading(false);
      }
    }
  };
  // Get model info (name and icon)
  const getModelInfo = (modelId) => {
    if (!modelId) return { name: 'AI Model', logo: '🤖', color: 'amber' };

    const modelLower = modelId.toLowerCase();
    const lobeBase = "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark";

    if (modelLower.includes('openai') || modelLower.includes('gpt')) {
      return {
        name: modelLower.includes('oss') ? 'GPT-OSS' : 'ChatGPT-4o',
        logo: `${lobeBase}/openai.png`,
        color: 'slate-100'
      };
    } else if (modelLower.includes('google') || modelLower.includes('gemini') || modelLower.includes('gemma')) {
      return {
        name: modelLower.includes('gemma') ? 'Gemma 3' : 'Gemini 2.0',
        logo: modelLower.includes('gemma') ? `${lobeBase}/gemma-color.png` : `${lobeBase}/gemini-color.png`,
        color: 'blue-700'
      };
    } else if (modelLower.includes('deepseek') || modelLower.includes('chimera')) {
      return {
        name: modelLower.includes('chimera') ? 'DeepSeek Chimera' : 'DeepSeek R1',
        logo: `${lobeBase}/deepseek-color.png`,
        color: 'blue'
      };
    } else if (modelLower.includes('meta') || modelLower.includes('llama')) {
      return {
        name: 'Llama 3.3',
        logo: `${lobeBase}/meta-color.png`,
        color: 'cyan'
      };
    } else if (modelLower.includes('nvidia') || modelLower.includes('nemotron')) {
      return {
        name: 'Nemotron',
        logo: `${lobeBase}/nvidia-color.png`,
        color: 'green'
      };
    } else if (modelLower.includes('mistral') || modelLower.includes('devstral')) {
      return {
        name: modelLower.includes('devstral') ? 'Devstral' : 'Mistral 7B',
        logo: `${lobeBase}/mistral-color.png`,
        color: 'orange'
      };
    } else if (modelLower.includes('qwen')) {
      return {
        name: 'Qwen 2.5',
        logo: `${lobeBase}/qwen-color.png`,
        color: 'pink'
      };
    } else if (modelLower.includes('xiaomi') || modelLower.includes('mimo')) {
      return {
        name: 'MiMo-V2',
        logo: `${lobeBase}/xiaomimimo.png`,
        color: 'gray'
      };
    } else if (modelLower.includes('tngtech')) {
      return {
        name: 'TNG Chimera',
        logo: `${lobeBase}/tngtech.png`,
        color: 'emerald'
      };
    } else if (modelLower.includes('qwen') && modelLower.includes('coder')) {
      return {
        name: 'Qwen Coder 3',
        logo: `${lobeBase}/qwen-color.png`,
        color: 'pink'
      };
    } else if (modelLower.includes('glm') || modelLower.includes('z-ai')) {
      return {
        name: 'GLM 4.5 Air',
        logo: `${lobeBase}/zhipu-color.png`,
        color: 'blue-600'
      };
    }

    // Default fallback
    const modelName = modelId.split('/').pop().split(':')[0].replace(/-/g, ' ');
    return {
      name: modelName,
      logo: '🤖',
      color: 'amber'
    };
  };

  const changeMonth = (direction) => {
    setSelectedMonth(prev => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;

      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }

      return { year: newYear, month: newMonth };
    });
  };

  const changeYear = (offset) => {
    setSelectedMonth(prev => ({ ...prev, year: prev.year + offset }));
  };

  const formatAISummary = (text) => {
    if (!text) return null;
    const sections = text.split(/\*\*(.*?)\*\*/g);
    
    let currentSection = null;
    let sectionContent = [];
    const formattedSections = [];
    
    sections.forEach((section, idx) => {
      if (idx % 2 === 1) {
        // This is a header
        if (currentSection && sectionContent.length > 0) {
          formattedSections.push({ title: currentSection, content: sectionContent.join('\n') });
        }
        currentSection = section;
        sectionContent = [];
      } else if (section.trim() && currentSection) {
        let content = section.trim();
        // Remove leading colon if present (from format like "**Title**: content")
        if (content.startsWith(':')) {
          content = content.substring(1).trim();
        }
        if (content) {
          sectionContent.push(content);
        }
      }
    });
    
    // Add the last section
    if (currentSection && sectionContent.length > 0) {
      formattedSections.push({ title: currentSection, content: sectionContent.join('\n') });
    }
    
    const getSectionAccent = (title) => {
      if (title.includes('Health') || title.includes('Financial Health')) return 'emerald';
      if (title.includes('Win') || title.includes('Success') || title.includes('Positive')) return 'green';
      if (title.includes('Concern') || title.includes('Warning') || title.includes('Alert')) return 'red';
      if (title.includes('Action') || title.includes('Recommendation') || title.includes('Suggestion')) return 'amber';
      if (title.includes('Summary') || title.includes('Overview')) return 'blue';
      if (title.includes('Trend') || title.includes('Pattern')) return 'cyan';
      return 'slate';
    };
    
    const accentColors = {
      emerald: { border: 'border-emerald-500/50', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      green: { border: 'border-green-500/50', text: 'text-green-400', bg: 'bg-green-500/10' },
      red: { border: 'border-red-500/50', text: 'text-red-400', bg: 'bg-red-500/10' },
      amber: { border: 'border-amber-500/50', text: 'text-amber-400', bg: 'bg-amber-500/10' },
      blue: { border: 'border-blue-500/50', text: 'text-blue-400', bg: 'bg-blue-500/10' },
      cyan: { border: 'border-cyan-500/50', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
      slate: { border: 'border-slate-500/30', text: 'text-slate-300', bg: 'bg-slate-500/5' }
    };
    
    return (
      <div className={`border ${theme === 'dark' ? 'border-slate-600/50 bg-slate-700/20' : 'border-slate-300/50 bg-slate-100/30'} rounded-lg p-6 space-y-6`}>
        {formattedSections.map((section, idx) => {
          const accentKey = getSectionAccent(section.title);
          const colors = accentColors[accentKey];
          const hasList = section.content.includes('•') || section.content.includes('-');
          
          return (
            <div
              key={idx}
              className={idx !== formattedSections.length - 1 ? `pb-6 ${theme === 'dark' ? 'border-b border-slate-600/30' : 'border-b border-slate-300/30'}` : ''}
            >
              {/* Section Title */}
              <h4 className={`font-semibold text-base ${colors.text} mb-3 flex items-center gap-2`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{
                  backgroundColor: colors.text.includes('emerald') ? '#10b981' :
                                   colors.text.includes('green') ? '#22c55e' :
                                   colors.text.includes('red') ? '#ef4444' :
                                   colors.text.includes('amber') ? '#f59e0b' :
                                   colors.text.includes('blue') ? '#3b82f6' :
                                   colors.text.includes('cyan') ? '#06b6d4' :
                                   '#cbd5e1'
                }}></span>
                {section.title}
              </h4>
              
              {/* Content */}
              <div className="pl-5">
                {hasList ? (
                  <ul className="space-y-2">
                    {section.content.split('\n').filter(line => line.trim()).map((line, i) => {
                      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                        const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
                        return (
                          <li key={i} className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} leading-relaxed text-sm`}>
                            <span className={`${colors.text} font-semibold mt-0.5 flex-shrink-0`}>→</span>
                            <span className="flex-1">{cleanLine}</span>
                          </li>
                        );
                      }
                      return (
                        <p key={i} className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} leading-relaxed text-sm`}>
                          {line.trim()}
                        </p>
                      );
                    })}
                  </ul>
                ) : (
                  <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} leading-relaxed text-sm`}>
                    {section.content}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${theme === 'dark' ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mx-auto mb-4"></div>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-lg`}>Loading financial data...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const barData = [
    { name: 'Income', value: analytics?.total_income || 0, color: CHART_COLORS.income },
    { name: 'Expenses', value: analytics?.total_expenses || 0, color: CHART_COLORS.expense },
  ];

  const pieData = (analytics?.category_breakdown || []).map(cat => ({
    name: cat.name,
    value: cat.amount
  }));

  const savingsRate = analytics?.total_income > 0
    ? ((analytics.net_savings / analytics.total_income) * 100).toFixed(1)
    : 0;

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  // Daily spending trend (monthly) or monthly spending (yearly) or yearly spending (overall)
  const getDailySpendingData = () => {
    if (viewMode === 'monthly') {
      // Monthly view: show daily breakdown for last 14 days in the month
      const dailyData = {};
      const monthStart = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
      const monthEnd = new Date(selectedMonth.year, selectedMonth.month, 0);

      transactions
        .filter(txn => {
          const txnDate = new Date(txn.date);
          return txnDate >= monthStart && txnDate <= monthEnd && txn.amount < 0;
        })
        .forEach(txn => {
          const date = new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyData[date] = (dailyData[date] || 0) + Math.abs(txn.amount);
        });

      return Object.entries(dailyData)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-14);
    } else if (viewMode === 'yearly') {
      // Yearly view: show monthly breakdown for the entire year
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData = monthNames.map(month => ({ date: month, amount: 0 }));

      transactions
        .filter(txn => {
          const txnDate = new Date(txn.date);
          return txnDate.getFullYear() === selectedMonth.year && txn.amount < 0;
        })
        .forEach(txn => {
          const monthIndex = new Date(txn.date).getMonth();
          monthlyData[monthIndex].amount += Math.abs(txn.amount);
        });

      return monthlyData;
    } else {
      // Overall view: show yearly breakdown for all years
      const yearlyData = {};
      transactions
        .filter(txn => txn.amount < 0)
        .forEach(txn => {
          const year = new Date(txn.date).getFullYear();
          yearlyData[year] = (yearlyData[year] || 0) + Math.abs(txn.amount);
        });

      return Object.entries(yearlyData)
        .map(([date, amount]) => ({ date: date.toString(), amount }))
        .sort((a, b) => parseInt(a.date) - parseInt(b.date));
    }
  };

  // Weekly pattern (monthly) or quarterly pattern (yearly) or monthly pattern (overall)
  const getWeeklyPatternData = () => {
    if (viewMode === 'monthly') {
      // Monthly view: show weekly breakdown
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyData = dayOfWeek.map(day => ({ day, amount: 0 }));

      transactions
        .filter(txn => {
          const txnDate = new Date(txn.date);
          const monthStart = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
          const monthEnd = new Date(selectedMonth.year, selectedMonth.month, 0);
          return txnDate >= monthStart && txnDate <= monthEnd && txn.amount < 0;
        })
        .forEach(txn => {
          const dayIndex = new Date(txn.date).getDay();
          weeklyData[dayIndex].amount += Math.abs(txn.amount);
        });

      return weeklyData;
    } else if (viewMode === 'yearly') {
      // Yearly view: show quarterly breakdown
      const quarters = [
        { quarter: 'Q1', amount: 0 },
        { quarter: 'Q2', amount: 0 },
        { quarter: 'Q3', amount: 0 },
        { quarter: 'Q4', amount: 0 }
      ];

      transactions
        .filter(txn => {
          const txnDate = new Date(txn.date);
          return txnDate.getFullYear() === selectedMonth.year && txn.amount < 0;
        })
        .forEach(txn => {
          const monthIndex = new Date(txn.date).getMonth();
          const quarterIndex = Math.floor(monthIndex / 3);
          quarters[quarterIndex].amount += Math.abs(txn.amount);
        });

      return quarters;
    } else {
      // Overall view: show monthly breakdown across all years
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData = monthNames.map(month => ({ day: month, amount: 0 }));

      transactions
        .filter(txn => txn.amount < 0)
        .forEach(txn => {
          const monthIndex = new Date(txn.date).getMonth();
          monthlyData[monthIndex].amount += Math.abs(txn.amount);
        });

      return monthlyData;
    }
  };

  // Cumulative net savings trend (daily for monthly, monthly for yearly)
  const getCumulativeSavingsData = () => {
    if (viewMode === 'monthly') {
      // Monthly view: daily cumulative
      const monthStart = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
      const monthEnd = new Date(selectedMonth.year, selectedMonth.month, 0);
      
      const dailySavings = {};
      let cumulative = 0;

      transactions
        .filter(txn => {
          const txnDate = new Date(txn.date);
          return txnDate >= monthStart && txnDate <= monthEnd;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach(txn => {
          const date = new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          cumulative += txn.amount;
          dailySavings[date] = cumulative;
        });

      return Object.entries(dailySavings)
        .map(([date, savings]) => ({ date, savings: Math.max(0, savings) }))
        .slice(-14);
    } else {
      // Yearly view: monthly cumulative
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlySavings = {};
      let cumulative = 0;

      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(selectedMonth.year, month, 1);
        const monthEnd = new Date(selectedMonth.year, month + 1, 0);
        let monthTotal = 0;

        transactions
          .filter(txn => {
            const txnDate = new Date(txn.date);
            return txnDate >= monthStart && txnDate <= monthEnd;
          })
          .forEach(txn => {
            monthTotal += txn.amount;
          });

        cumulative += monthTotal;
        monthlySavings[monthNames[month]] = cumulative;
      }

      return Object.entries(monthlySavings)
        .map(([date, savings]) => ({ date, savings: Math.max(0, savings) }));
    }
  };

  // Comparison data (monthly vs previous for monthly view, quarters for yearly)
  const getMonthlyComparisonData = () => {
    if (viewMode === 'monthly') {
      const prevMonth = selectedMonth.month === 1 ? { year: selectedMonth.year - 1, month: 12 } : { year: selectedMonth.year, month: selectedMonth.month - 1 };
      
      const currentMonthIncome = analytics?.total_income || 0;
      const currentMonthExpenses = analytics?.total_expenses || 0;
      
      const prevMonthStart = new Date(prevMonth.year, prevMonth.month - 1, 1);
      const prevMonthEnd = new Date(prevMonth.year, prevMonth.month, 0);
      
      let prevMonthIncome = 0;
      let prevMonthExpenses = 0;
      
      transactions.forEach(txn => {
        const txnDate = new Date(txn.date);
        if (txnDate >= prevMonthStart && txnDate <= prevMonthEnd) {
          if (txn.amount > 0) {
            prevMonthIncome += txn.amount;
          } else {
            prevMonthExpenses += Math.abs(txn.amount);
          }
        }
      });
      
      return [
        { month: 'Previous', income: prevMonthIncome, expenses: prevMonthExpenses },
        { month: 'Current', income: currentMonthIncome, expenses: currentMonthExpenses },
      ];
    } else {
      // Yearly view: show quarters
      const quarters = [
        { month: 'Q1', income: 0, expenses: 0 },
        { month: 'Q2', income: 0, expenses: 0 },
        { month: 'Q3', income: 0, expenses: 0 },
        { month: 'Q4', income: 0, expenses: 0 }
      ];

      transactions
        .filter(txn => new Date(txn.date).getFullYear() === selectedMonth.year)
        .forEach(txn => {
          const quarterIndex = Math.floor(new Date(txn.date).getMonth() / 3);
          if (txn.amount > 0) {
            quarters[quarterIndex].income += txn.amount;
          } else {
            quarters[quarterIndex].expenses += Math.abs(txn.amount);
          }
        });

      return quarters;
    }
  };

  const dailySpendingData = getDailySpendingData();
  const avgDailySpending = dailySpendingData.length
    ? dailySpendingData.reduce((sum, d) => sum + (d.amount || 0), 0) / dailySpendingData.length
    : 0;
  const dailySpendingChartData = dailySpendingData.map((d, i) => {
    let sum = 0;
    let count = 0;
    for (let j = i; j >= 0 && j >= i - 2; j--) {
      sum += dailySpendingData[j].amount || 0;
      count += 1;
    }
    const ma3 = count ? sum / count : 0;
    return { ...d, ma3 };
  });
  const weeklyPatternData = getWeeklyPatternData();
  const cumulativeSavingsData = getCumulativeSavingsData();
  const monthlyComparisonData = getMonthlyComparisonData();

  // Enhanced custom tooltip style with theme support
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${theme === 'dark' ? 'bg-slate-900/95 border-slate-600/50' : 'bg-white/95 border-slate-300/50'} backdrop-blur-md border rounded-xl p-4 shadow-2xl`}>
          <p className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-semibold mb-2 text-sm`}>{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} text-sm`}>{entry.name}:</span>
                </div>
                <span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-medium text-sm`}>
                  ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`overflow-x-hidden ${theme === 'dark' ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
      {/* Section 1: Header & Summary Cards */}
      <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f172a]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
        <div className="max-w-7xl mx-auto w-full">
      {/* Personalized Greeting */}
      {user && (
        <div className="mb-6 text-center">
          <h2 className={`text-3xl font-light ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} mb-1`}>
            Welcome back, <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user.first_name}</span>
          </h2>
          <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Here's your financial overview for {viewMode === 'monthly' ? new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : `${selectedMonth.year}`}
          </p>
        </div>
      )}

      {/* Main Header */}
      <div className="text-center mb-12">
        <h1 className={`text-6xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center justify-center gap-4`}>
          <span className="text-amber-400">💼</span>
          Financial Dashboard
        </h1>
        <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-8`}>Complete financial overview & insights</p>

        {/* View Mode Toggle & Date Selector */}
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
          {/* View Mode Toggle */}
          <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-200/50'} backdrop-blur-sm rounded-lg p-1 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'} border`}>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === 'monthly'
                  ? 'bg-blue-500/80 text-white shadow-lg'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === 'yearly'
                  ? 'bg-blue-500/80 text-white shadow-lg'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Yearly
            </button>
            <button
              onClick={() => setViewMode('overall')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === 'overall'
                  ? 'bg-blue-500/80 text-white shadow-lg'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Overall
            </button>
          </div>

          {/* Date Selector */}
          <div className={`flex items-center justify-center gap-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-200/50'} backdrop-blur-sm rounded-xl shadow-lg px-6 py-3 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'} border`}>
            {viewMode !== 'overall' && (
              <>
                <button
                  onClick={() => viewMode === 'monthly' ? changeMonth(-1) : changeYear(-1)}
                      className={`p-2 hover:${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'} rounded-lg transition-colors text-xl ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  ◀
                </button>
                    <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} min-w-[160px] text-center text-lg`}>
                  {viewMode === 'monthly'
                    ? new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })
                    : `Year ${selectedMonth.year}`
                  }
                </span>
                <button
                  onClick={() => viewMode === 'monthly' ? changeMonth(1) : changeYear(1)}
                      className={`p-2 hover:${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'} rounded-lg transition-colors text-xl ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  ▶
                </button>
              </>
            )}
            {viewMode === 'overall' && (
              <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg`}>All Time Data</span>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Income Card */}
            <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-green-500/50' : 'border-slate-200 hover:border-green-400/50'} border transition-all hover:shadow-2xl hover:scale-105`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>Income</span>
                <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'} rounded-lg flex items-center justify-center`}>
                  <TrendingUp className={`w-7 h-7 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} strokeWidth={2} />
                </div>
          </div>
              <p className={`text-4xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mb-2`}>
            ${analytics?.total_income?.toFixed(2) || '0.00'}
          </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{viewMode === 'monthly' ? 'This month' : viewMode === 'yearly' ? 'This year' : 'All time'}</p>
        </div>

            {/* Expenses Card */}
            <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-red-500/50' : 'border-slate-200 hover:border-red-400/50'} border transition-all hover:shadow-2xl hover:scale-105`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>Expenses</span>
                <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                  <TrendingDown className={`w-7 h-7 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} strokeWidth={2} />
                </div>
          </div>
              <p className={`text-4xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mb-2`}>
            ${analytics?.total_expenses?.toFixed(2) || '0.00'}
          </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{viewMode === 'monthly' ? 'This month' : viewMode === 'yearly' ? 'This year' : 'All time'}</p>
        </div>

            {/* Net Savings Card */}
            <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-amber-500/50' : 'border-slate-200 hover:border-amber-400/50'} border transition-all hover:shadow-2xl hover:scale-105`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>Net Savings</span>
                <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'} rounded-lg flex items-center justify-center`}>
                  <Wallet className={`w-7 h-7 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={2} />
                </div>
          </div>
              <p className={`text-4xl font-bold mb-2 ${(analytics?.net_savings || 0) >= 0 ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-600') : (theme === 'dark' ? 'text-red-400' : 'text-red-600')}`}>
            ${Math.abs(analytics?.net_savings || 0).toFixed(2)}
          </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{viewMode === 'monthly' ? 'This month' : viewMode === 'yearly' ? 'This year' : 'All time'}</p>
        </div>

            {/* Savings Rate Card */}
            <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-blue-500/50' : 'border-slate-200 hover:border-blue-400/50'} border transition-all hover:shadow-2xl hover:scale-105`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>Savings Rate</span>
                <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
                  <Percent className={`w-7 h-7 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth={2} />
                </div>
          </div>
              <p className={`text-4xl font-bold mb-2 ${savingsRate >= 0 ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600') : (theme === 'dark' ? 'text-red-400' : 'text-red-600')}`}>
            {savingsRate}%
          </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Of income saved</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Section 7: Reports */}
      <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-3 flex items-center justify-center gap-3`}>
              <Scale className={`w-10 h-10 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={1.8} />
              Reports
            </h2>
            <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Download a professional report with summary, charts, budgets, and AI recommendations.
            </p>
          </div>
          
          <div className={`grid grid-cols-1 gap-8`}>
            {/* Download Card */}
            <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-amber-500/50' : 'border-slate-200 hover:border-amber-400/50'} border transition-all`}>
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4`}>Download</h3>
              <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-4`}>
                PDF includes AI recommendations with model credit, budgets status, charts and transactions.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadReport('pdf')}
                  disabled={reportLoading}
                  className={`px-5 py-3 rounded-lg font-semibold shadow transition-all ${theme === 'dark' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-500 hover:to-amber-600' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'} disabled:opacity-50`}
                >
                  {reportLoading ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={() => handleDownloadReport('csv')}
                  disabled={reportLoading}
                  className={`px-5 py-3 rounded-lg font-semibold shadow transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'} disabled:opacity-50`}
                >
                  {reportLoading ? 'Preparing...' : 'Download CSV'}
                </button>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} text-sm`}>{reportStatus}</span>
                  <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} text-sm`}>{Math.round(reportProgress)}%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div
                    className={`h-2 rounded-full ${theme === 'dark' ? 'bg-amber-400' : 'bg-amber-600'} transition-all`}
                    style={{ width: `${reportProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      

      {/* Section 2: Main Charts - Income vs Expenses & Category Breakdown */}
      <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-3 flex items-center justify-center gap-3`}>
              <LayoutDashboard className={`w-11 h-11 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={2} />
              Financial Overview
            </h2>
            <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Income, expenses, and spending breakdown</p>
      </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
            <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60' : 'bg-gradient-to-br from-white to-slate-50'} backdrop-blur-sm rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700/50 hover:border-slate-600/50' : 'border-slate-200/50 hover:border-slate-300/50'} border transition-all`}>
              <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
                <span className="text-emerald-400">💵</span>
                Income vs Expenses
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00d4aa" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke={theme === 'dark' ? '#94a3b8' : '#475569'}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={theme === 'dark' ? '#94a3b8' : '#475569'}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                    {barData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.name === 'Income' ? 'url(#incomeGradient)' : 'url(#expenseGradient)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

        {/* Pie Chart */}
            <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60' : 'bg-gradient-to-br from-white to-slate-50'} backdrop-blur-sm rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700/50 hover:border-slate-600/50' : 'border-slate-200/50 hover:border-slate-300/50'} border transition-all`}>
              <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
                <span className="text-teal-400">🥧</span>
                Spending by Category
              </h2>
          {pieData.length === 0 ? (
                <div className={`flex items-center justify-center h-[300px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200'} rounded-full flex items-center justify-center`}>
                      <span className="text-2xl">📊</span>
                    </div>
                    <p className="text-lg font-medium">No expense data for this month</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'} mt-1`}>Add some transactions to see the breakdown</p>
                  </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => percent > 0.05 ? `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={90}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'}
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]}
                          style={{
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            transition: 'all 0.3s ease'
                          }}
                        />
                  ))}
                </Pie>
                    <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        </div>
      </div>
      </section>

      {/* Section 3: Spending Trends & Patterns */}
      <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a]' : 'bg-gradient-to-br from-slate-50 to-white'}`}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-3 flex items-center justify-center gap-3`}>
              <TrendingUp className={`w-11 h-11 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth={2} />
              Spending Trends
            </h2>
            <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Daily patterns and weekly insights</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Spending Trend */}
            <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60' : 'bg-gradient-to-br from-white to-slate-50'} backdrop-blur-sm rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700/50 hover:border-slate-600/50' : 'border-slate-200/50 hover:border-slate-300/50'} border transition-all`}>
              <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
                <span className="text-orange-400">📅</span>
                Daily Spending Trend (Last 14 Days)
              </h2>
              {dailySpendingData.length === 0 ? (
                <div className={`flex items-center justify-center h-[300px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200'} rounded-full flex items-center justify-center`}>
                      <span className="text-2xl">📈</span>
                    </div>
                    <p className="text-lg font-medium">No spending data available</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'} mt-1`}>Add expenses to see daily trends</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailySpendingChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} syncId="dashboardSync">
                    <defs>
                      <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="maGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      stroke={theme === 'dark' ? '#94a3b8' : '#475569'}
                      fontSize={11}
                      tick={{ fill: theme === 'dark' ? '#f59e0b' : '#334155' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={theme === 'dark' ? '#94a3b8' : '#475569'}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#ff6b6b"
                      strokeWidth={3}
                      dot={{ fill: '#ff6b6b', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 7, fill: '#ff6b6b', strokeWidth: 2, stroke: '#ffffff' }}
                      fill="url(#spendingGradient)"
                    />
                    <Line
                      type="monotone"
                      dataKey="ma3"
                      name="3-day MA"
                      stroke="#f59e0b"
                      strokeDasharray="6 4"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: '#f59e0b' }}
                      fill="url(#maGradient)"
                    />
                    <ReferenceLine y={avgDailySpending} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Avg', position: 'right', fill: theme === 'dark' ? '#94a3b8' : '#475569' }} />
                    <Brush dataKey="date" travellerWidth={10} height={24} stroke={theme === 'dark' ? '#94a3b8' : '#475569'} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Weekly Spending Pattern */}
            <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60' : 'bg-gradient-to-br from-white to-slate-50'} backdrop-blur-sm rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700/50 hover:border-slate-600/50' : 'border-slate-200/50 hover:border-slate-300/50'} border transition-all`}>
              <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
                <span className="text-purple-400">📆</span>
                Weekly Spending Pattern
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyPatternData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} syncId="dashboardSync">
                  <defs>
                    <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} opacity={0.3} />
                  <XAxis
                    dataKey="day"
                    stroke={theme === 'dark' ? '#94a3b8' : '#475569'}
                    fontSize={12}
                    tick={{ fill: theme === 'dark' ? '#f59e0b' : '#334155' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={theme === 'dark' ? '#94a3b8' : '#475569'}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {weeklyPatternData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]}
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </Bar>
                  <Brush dataKey="day" travellerWidth={10} height={24} stroke={theme === 'dark' ? '#94a3b8' : '#475569'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Monthly Comparison & Savings Trend */}
      <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-3 flex items-center justify-center gap-3`}>
              <Scale className={`w-11 h-11 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={2} />
              Progress & Comparison
            </h2>
            <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Monthly comparison and savings growth</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Comparison */}
            <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60' : 'bg-gradient-to-br from-white to-slate-50'} backdrop-blur-sm rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700/50 hover:border-slate-600/50' : 'border-slate-200/50 hover:border-slate-300/50'} border transition-all`}>
              <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
                <span className="text-blue-400">📊</span>
                Monthly Comparison
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} syncId="dashboardSync">
                  <defs>
                    <linearGradient id="incomeCompareGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00d4aa" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="expenseCompareGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    stroke={theme === 'dark' ? '#94a3b8' : '#475569'}
                    fontSize={12}
                    tick={{ fill: theme === 'dark' ? '#f59e0b' : '#334155' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={theme === 'dark' ? '#94a3b8' : '#475569'}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      color: theme === 'dark' ? '#94a3b8' : '#475569',
                      fontSize: '12px',
                      paddingTop: '10px'
                    }}
                  />
                  <Bar
                    dataKey="income"
                    fill="url(#incomeCompareGradient)"
                    radius={[4, 4, 0, 0]}
                    name="Income"
                    maxBarSize={50}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="url(#expenseCompareGradient)"
                    radius={[4, 4, 0, 0]}
                    name="Expenses"
                    maxBarSize={50}
                  />
                  <Brush dataKey="month" travellerWidth={10} height={24} stroke={theme === 'dark' ? '#94a3b8' : '#475569'} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cumulative Savings Trend */}
            <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-slate-800/60 to-slate-900/60' : 'from-slate-200/60 to-slate-300/60'} backdrop-blur-sm rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border border-slate-700/50 hover:border-slate-600/50' : 'border border-slate-400/50 hover:border-slate-300/50'} transition-all`}>
              <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
                <span className="text-yellow-400">💎</span>
                Cumulative Savings Trend
              </h2>
              {cumulativeSavingsData.length === 0 ? (
                <div className={`flex items-center justify-center h-[300px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-300/50'} rounded-full flex items-center justify-center`}>
                      <span className="text-2xl">💰</span>
                    </div>
                    <p className="text-lg font-medium">No savings data available</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'} mt-1`}>Add income transactions to see savings growth</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cumulativeSavingsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} syncId="dashboardSync">
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffd93d" stopOpacity={0.3}/>
                        <stop offset="50%" stopColor="#ffd93d" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ffd93d" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ffd93d" />
                        <stop offset="100%" stopColor="#ffb347" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      stroke={theme === 'dark' ? '#94a3b8' : '#475569'}
                      fontSize={11}
                      tick={{ fill: theme === 'dark' ? '#f59e0b' : '#334155' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={theme === 'dark' ? '#94a3b8' : '#475569'}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      stroke="url(#strokeGradient)"
                      fillOpacity={1}
                      fill="url(#colorSavings)"
                      strokeWidth={3}
                      dot={{ fill: '#ffd93d', r: 4, strokeWidth: 2, stroke: theme === 'dark' ? '#ffffff' : '#000000' }}
                      activeDot={{ r: 6, fill: '#ffd93d', strokeWidth: 2, stroke: theme === 'dark' ? '#ffffff' : '#000000' }}
                    />
                    <Brush dataKey="date" travellerWidth={10} height={24} stroke={theme === 'dark' ? '#94a3b8' : '#475569'} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: AI Financial Insights */}
      <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto w-full">
          <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'} rounded-3xl shadow-xl border relative overflow-hidden`}>
            {(aiMode === 'summary' ? aiModelUsed : chatModelUsed) && (
              <div className="absolute top-6 right-6 z-10">
                {(() => {
                  const activeModel = aiMode === 'summary' ? aiModelUsed : chatModelUsed;
                  const modelInfo = getModelInfo(activeModel);
                  const colorMap = {
                    emerald: 'from-emerald-500/20 to-green-500/20 border-emerald-400/50 text-emerald-300',
                    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-400/50 text-blue-300',
                    purple: 'from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-300',
                    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-400/50 text-cyan-300',
                    pink: 'from-pink-500/20 to-rose-500/20 border-pink-400/50 text-pink-300',
                    amber: 'from-amber-500/20 to-yellow-500/20 border-amber-400/50 text-amber-300',
                    green: 'from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-300',
                    orange: 'from-orange-500/20 to-amber-500/20 border-orange-400/50 text-orange-300',
                    gray: 'from-slate-400/20 to-slate-600/20 border-slate-400/50 text-slate-200',
                    'blue-700': 'from-blue-700/20 to-cyan-600/20 border-blue-600/50 text-blue-300',
                    'blue-600': 'from-blue-600/20 to-cyan-500/20 border-blue-500/50 text-blue-300',
                    'slate-100': 'from-slate-200/20 to-slate-400/20 border-slate-300/50 text-slate-800'
                  };
                  const colorClass = colorMap[modelInfo.color] || colorMap.amber;
                  return (
                    <div className={`bg-gradient-to-br ${colorClass} backdrop-blur-md rounded-xl px-4 py-2.5 border shadow-xl flex items-center gap-2.5`}>
                      {modelInfo.logo.startsWith('http') ? (
                        <img src={modelInfo.logo} alt={modelInfo.name} className="w-5 h-5 object-contain rounded-sm" />
                      ) : (
                        <span className="text-lg">{modelInfo.logo}</span>
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold leading-tight">{modelInfo.name}</span>
                        <span className="text-[10px] opacity-75 leading-tight font-medium">Powered by</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
        <div className="p-8">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-100'}`}>
                  <Bot className={`w-9 h-9 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={1.8} />
                </div>
                <div className="flex flex-col">
                  <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>AI Financial Insights</h2>
                  <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-xs`}>Based on your actual transactions</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800/60' : 'bg-slate-200/60'} rounded-lg p-1 border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'}`}>
                  <button
                    onClick={() => setAiMode('summary')}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      aiMode === 'summary'
                        ? 'bg-amber-500/80 text-slate-900 shadow'
                        : theme === 'dark'
                        ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setAiMode('chat')}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      aiMode === 'chat'
                        ? 'bg-blue-500/80 text-white shadow'
                        : theme === 'dark'
                        ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    Chat
                  </button>
                </div>
              </div>
            </div>

          {aiMode === 'summary' ? (
            aiSummary ? (
              <div className="space-y-6">
                <div className={`${theme === 'dark' ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white border-slate-200/50'} rounded-2xl p-6 shadow-md border max-h-[340px] overflow-y-auto`}>
                  {formatAISummary(aiSummary)}
                </div>
                  
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-500/30">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-xs text-green-400 font-medium">Analysis Complete</span>
                  </div>
                  <button
                    onClick={handleGenerateAI}
                    className={`px-4 py-2 ${theme === 'dark' ? 'bg-slate-700/60 hover:bg-slate-700 border-slate-600' : 'bg-slate-200 hover:bg-slate-300 border-slate-300'} text-amber-400 font-medium rounded-lg flex items-center gap-2 transition-all border`}
                  >
                    <RefreshCw className="w-5 h-5" strokeWidth={2.2} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'} rounded-xl p-8 text-center shadow-md border`}>
                  <div className="inline-block p-4">
                    {aiLoading && currentTryingModel ? (
                      (() => {
                        const modelInfo = getModelInfo(currentTryingModel);
                        const isUrl = modelInfo.logo.startsWith('http');
                        return isUrl ? (
                          <img
                            src={modelInfo.logo}
                            alt={modelInfo.name}
                            className="w-12 h-12 object-contain animate-pulse-fast rounded-md"
                          />
                        ) : (
                          <span className="text-5xl animate-pulse-fast">{modelInfo.logo}</span>
                        );
                      })()
                    ) : aiLoading ? (
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-400 border-t-transparent"></div>
                    ) : (
                <Sparkles 
                  className={`w-10 h-10 ${theme === 'dark' ? 'text-amber-300' : 'text-amber-600'} animate-pulse`}
                  strokeWidth={1.5} 
                />
                    )}
              </div>
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2`}>
                    {aiLoading && currentTryingModel ? (
                      <span className="flex items-center justify-center gap-2">
                        Analyzing with <span className={theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}>{getModelInfo(currentTryingModel).name}</span>
                      </span>
                    ) : aiLoading ? (
                      'Analyzing Your Finances...'
                    ) : (
                      'Get Personalized Financial Advice'
                    )}
              </h3>
                  <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-6 max-w-md mx-auto`}>
                    {aiLoading
                      ? 'Our AI is processing your financial data and generating personalized insights.'
                      : 'Our AI analyzes your spending patterns, compares to last month, and provides actionable insights.'
                    }
              </p>
              <button
                onClick={handleGenerateAI}
                disabled={aiLoading}
                    className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl font-semibold shadow transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-900 border-t-transparent"></div>
                        <span>Analyzing...</span>
                        {currentTryingModel && (() => {
                          const modelInfo = getModelInfo(currentTryingModel);
                        })()}
                      </div>
                    ) : 'Generate AI Insights'}
              </button>
            </div>
            )
          ) : (
            <div className="space-y-4">
              <div className={`${theme === 'dark' ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white border-slate-200/50'} rounded-2xl p-6 shadow-md border max-h-[340px] overflow-y-auto`}>
                {chatMessages.map((m, idx) => {
                  const isAssistant = m.role === 'assistant';
                  const isLast = idx === chatMessages.length - 1;
                  const modelInfo = chatModelUsed ? getModelInfo(chatModelUsed) : (chatTryingModel ? getModelInfo(chatTryingModel) : null);
                  return (
                    <div key={idx} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-3`}>
                      <div className={`max-w-[75%] ${isAssistant ? (theme === 'dark' ? 'bg-slate-700/60 text-slate-100' : 'bg-slate-100 text-slate-800') : (theme === 'dark' ? 'bg-blue-600/80 text-white' : 'bg-blue-500/90 text-white')} rounded-xl px-4 py-3`}>
                        {isAssistant && isLast && modelInfo && (
                          <div className="flex items-center gap-2 mb-2">
                            {modelInfo.logo.startsWith('http') ? (
                              <img src={modelInfo.logo} alt={modelInfo.name} className="w-4 h-4 rounded-sm object-contain" />
                            ) : (
                              <span className="text-base">{modelInfo.logo}</span>
                            )}
                            <span className="text-[11px] font-semibold">{chatModelUsed ? `Answered by ${modelInfo.name}` : `Using ${modelInfo.name}`}</span>
                          </div>
                        )}
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {chatLoading && (
                <div className={`flex justify-start mb-3`}>
                  <div className={`max-w-[75%] ${theme === 'dark' ? 'bg-slate-800/60 text-slate-100' : 'bg-slate-100 text-slate-800'} rounded-xl px-4 py-3`}>
                    <div className="typing">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="h-6 flex items-center">
                  {chatLoading && (
                    <>
                      {chatTryingModel ? (
                        <div className="h-6 flex items-center">
                          {chatLoading && (
                            <>
                              {chatTryingModel ? (
                                <span
                                  className={`${
                                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                                  } text-sm flex items-center gap-1.5`}
                                >
                                  <span>Trying</span>
                                  {(() => {
                                    const model = getModelInfo(chatTryingModel);
                                    return model ? (
                                      <>
                                        {model.logo ? (
                                          <img
                                            src={model.logo}
                                            alt={model.name || "Model"}
                                            className="w-4 h-4 rounded-sm object-contain"
                                          />
                                        ) : (
                                          <span className="w-4 h-4 rounded-sm bg-gray-200 dark:bg-gray-700 inline-block" />
                                        )}
                                        <span>{model.name || chatTryingModel}...</span>
                                      </>
                                    ) : (
                                      <span>{chatTryingModel || "AI"}...</span>
                                    );
                                  })()}
                                </span>
                              ) : (
                                <span
                                  className={`${
                                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                                  } text-sm`}
                                >
                                  Connecting to AI...
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} text-sm`}>Connecting to AI...</span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    placeholder="Type your message..."
                    className={`w-64 px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-700 text-slate-200 placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'}`}
                    disabled={chatLoading}
                  />
                  <button
                    onClick={handleAskAI}
                    disabled={chatLoading || !chatQuestion.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold shadow transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {chatLoading ? 'Send...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        </div>
        </div>
      </section>

      {/* Section 6: Recent Activity */}
      <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-3 flex items-center justify-center gap-3`}>
              <History className={`w-10 h-10 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} strokeWidth={1.8} />
              Recent Activity
            </h2>
            <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Your latest transactions</p>
          </div>
          
          <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} backdrop-blur-sm rounded-2xl shadow-xl p-8 border`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                <ArrowLeftRight className={`w-7 h-7 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={1.8} />
                Recent Transactions
          </h2>
          <a
            href="/history"
                className={`${theme === 'dark' ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'} font-medium text-sm flex items-center gap-1 transition-colors`}
          >
            View All
            <span>→</span>
          </a>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center py-12">
                <div className={`inline-block p-4 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200/50'} rounded-full mb-4`}>
              <span className="text-4xl">📊</span>
            </div>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-4`}>No transactions yet</p>
            <a
              href="/transactions"
                  className={`inline-block px-6 py-3 ${theme === 'dark' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-500 hover:to-amber-600' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'} rounded-lg font-semibold transition-all`}
            >
              Add Your First Transaction
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((txn) => (
              <div
                key={txn.id}
                    className={`flex items-center justify-between p-4 ${theme === 'dark' ? 'bg-slate-700/30 hover:bg-slate-700/50 border-slate-600/50' : 'bg-slate-100/50 hover:bg-slate-200/50 border-slate-300/50'} rounded-xl transition-all border`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        txn.amount > 0 ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
                  }`}>
                    {txn.category_icon}
                  </div>
                  <div>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{txn.description}</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{txn.category_name}</p>
                  </div>
                </div>
                    <p className={`text-lg font-bold ${txn.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
      </section>
    {/* Floating Chat Widget Button */}
    <button
      onClick={() => setIsChatWidgetOpen(prev => !prev)}
      className={`
        fixed bottom-6 right-6 z-50
        rounded-full p-4
        bg-gradient-to-tr from-blue-500 to-cyan-400
        text-white
        shadow-[0_8px_32px_rgba(245,158,11,0.35)]
        backdrop-blur-sm
        transition-all duration-400
        hover:shadow-[0_16px_48px_rgba(245,158,11,0.45)] hover:-translate-y-1.5
        active:scale-95 active:shadow-inner
        flex items-center justify-center
      `}
      aria-label="Open AI Chat"
    >
      {/* Ripple effect layer */}
      <span className="
        absolute inset-0 rounded-full
        bg-white/20 scale-0 opacity-0
        group-active:scale-150 group-active:opacity-0
        group-active:transition-all group-active:duration-500 group-active:ease-out
      " />

      <Bot className="w-6 h-6 relative z-10" />
    </button>

    {/* Chat Widget Popup */}
    {isChatWidgetOpen && (
      <div className={`fixed bottom-20 right-6 z-50 w-96 ${theme === 'dark' ? 'bg-slate-900/90 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'} backdrop-blur-md shadow-2xl rounded-2xl border`}>
        <div className={`flex items-center justify-between px-4 py-3 ${theme === 'dark' ? 'bg-slate-800/70 border-b border-slate-700' : 'bg-slate-100/70 border-b border-slate-300'} rounded-t-2xl`}>
          <div className="flex items-center gap-2">
            <Bot className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} w-5 h-5`} />
            <span className="font-semibold text-sm">AI Chat</span>
          </div>
          {(() => {
            const activeModel = chatWidgetModelUsed || chatWidgetTryingModel;
            if (!activeModel) return null;
            const modelInfo = getModelInfo(activeModel);
            return (
              <div className={`flex items-center gap-2 rounded-md px-2 py-1 border ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-700'}`}>
                {modelInfo.logo.startsWith('http') ? (
                  <img src={modelInfo.logo} alt={modelInfo.name} className="w-3.5 h-3.5 object-contain rounded-sm" />
                ) : (
                  <span className="text-sm">{modelInfo.logo}</span>
                )}
                <span className="text-[10px] font-semibold">{chatWidgetModelUsed ? modelInfo.name : `Trying ${modelInfo.name}`}</span>
              </div>
            );
          })()}
          <button onClick={() => setIsChatWidgetOpen(false)} className={`${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} text-sm`}>×</button>
        </div>
        <div className="p-4 max-h-[320px] overflow-y-auto">
          {chatWidgetMessages.map((m, idx) => {
            const isAssistant = m.role === 'assistant';
            const isLast = idx === chatWidgetMessages.length - 1;
            const modelInfo = chatWidgetModelUsed ? getModelInfo(chatWidgetModelUsed) : (chatWidgetTryingModel ? getModelInfo(chatWidgetTryingModel) : null);
            return (
              <div key={idx} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-3`}>
                <div className={`max-w-[80%] ${isAssistant ? (theme === 'dark' ? 'bg-slate-800/60 text-slate-100' : 'bg-slate-100 text-slate-800') : (theme === 'dark' ? 'bg-blue-600/80 text-white' : 'bg-blue-500/90 text-white')} rounded-xl px-4 py-3`}>
                  {isAssistant && isLast && modelInfo && (
                    <div className="flex items-center gap-2 mb-2">
                      {modelInfo.logo.startsWith('http') ? (
                        <img src={modelInfo.logo} alt={modelInfo.name} className="w-3.5 h-3.5 rounded-sm object-contain" />
                      ) : (
                        <span className="text-sm">{modelInfo.logo}</span>
                      )}
                      <span className="text-[10px] font-semibold">{chatWidgetModelUsed ? `Answered by ${modelInfo.name}` : `Using ${modelInfo.name}`}</span>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</div>
                </div>
              </div>
            );
          })}
          {chatWidgetLoading && (
            <div className="flex justify-start mb-3">
              <div className={`max-w-[80%] ${theme === 'dark' ? 'bg-slate-800/60 text-slate-100' : 'bg-slate-100 text-slate-800'} rounded-xl px-4 py-3`}>
                <div className="typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className={`flex items-center gap-2 px-4 py-3 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'} rounded-b-2xl`}>
          <input
            type="text"
            value={chatWidgetInput}
            onChange={(e) => setChatWidgetInput(e.target.value)}
            placeholder="Type your message..."
            className={`flex-1 px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-700 text-slate-200 placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'}`}
            disabled={chatWidgetLoading}
          />
          <button
            onClick={handleWidgetAsk}
            disabled={chatWidgetLoading || !chatWidgetInput.trim()}
            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold shadow transition-all hover:scale-105 disabled:opacity-50"
          >
            {chatWidgetLoading ? 'Send...' : 'Send'}
          </button>
        </div>
      </div>
    )}
    </div>
  );
}
 
export default Dashboard;
