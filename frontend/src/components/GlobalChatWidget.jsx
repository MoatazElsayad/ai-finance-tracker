import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getModelInfo } from '../pages/DashboardUtils';
import { askAIQuestion } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  X, 
  Bot, 
  Minimize2, 
  Check, 
  CheckCheck
} from 'lucide-react';

export default function GlobalChatWidget() {
  const { theme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tryingModel, setTryingModel] = useState(null);
  const [modelUsed, setModelUsed] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Dynamic Theme Colors based on Route
  const getThemeColors = () => {
    const path = location.pathname;
    if (path.startsWith('/savings')) {
      return {
        avatarBg: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
        botIcon: isDark ? 'text-blue-400' : 'text-blue-600',
        userBubble: 'bg-blue-600',
        sendButton: 'bg-blue-600 hover:bg-blue-700',
        fab: 'bg-blue-600 hover:bg-blue-700',
      };
    }
    if (path.startsWith('/shopping')) {
      return {
        avatarBg: isDark ? 'bg-green-500/20' : 'bg-green-100',
        botIcon: isDark ? 'text-green-400' : 'text-green-600',
        userBubble: 'bg-green-600',
        sendButton: 'bg-green-600 hover:bg-green-700',
        fab: 'bg-green-600 hover:bg-green-700',
      };
    }
    // Default Amber
    return {
      avatarBg: isDark ? 'bg-amber-500/20' : 'bg-amber-100',
      botIcon: isDark ? 'text-amber-400' : 'text-amber-600',
      userBubble: 'bg-amber-500',
      sendButton: 'bg-amber-500 hover:bg-amber-600',
      fab: 'bg-amber-500 hover:bg-amber-600',
    };
  };

  const colors = getThemeColors();

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { 
          id: 'init-1', 
          role: 'assistant', 
          text: 'Hi there! 👋 I\'m your personal finance AI. How can I help you save money today?', 
          timestamp: new Date(),
          status: 'read'
        }
      ]);
    }
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsgId = Date.now().toString();
    const newMessage = {
      id: userMsgId,
      role: 'user',
      text: inputValue,
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, newMessage]);
    const question = inputValue;
    setInputValue('');
    setIsLoading(true);
    setTryingModel(null);
    setModelUsed(null);

    // Simulate "Delivered" then "Read" status quickly
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === userMsgId ? { ...m, status: 'delivered' } : m));
    }, 500);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === userMsgId ? { ...m, status: 'read' } : m));
    }, 1000);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          text: 'Please log in again to use AI chat.', 
          timestamp: new Date() 
        }]);
        setIsLoading(false);
        return;
      }

      const eventSourceUrl = `${apiUrl}/ai/chat_progress?year=${currentYear}&month=${currentMonth}&question=${encodeURIComponent(question)}&token=${token}`;
      const eventSource = new EventSource(eventSourceUrl);
      let hasReceivedMessage = false;

      const timeout = setTimeout(() => {
        if (!hasReceivedMessage) {
          eventSource.close();
          fallbackToRegularChat(currentYear, currentMonth, question);
        }
      }, 8000);

      eventSource.onmessage = (event) => {
        hasReceivedMessage = true;
        clearTimeout(timeout);
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'trying_model':
              setTryingModel(data.model);
              break;
            case 'success':
              setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'assistant', 
                text: data.answer, 
                timestamp: new Date() 
              }]);
              setModelUsed(data.model);
              setIsLoading(false);
              eventSource.close();
              break;
            case 'error':
              setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'assistant', 
                text: `All Models Busy\n\n${data.message}\n\nPlease try again in a few minutes.`, 
                timestamp: new Date() 
              }]);
              setIsLoading(false);
              eventSource.close();
              break;
          }
        } catch {}
      };

      eventSource.onerror = () => {
        clearTimeout(timeout);
        if (!hasReceivedMessage) {
          fallbackToRegularChat(currentYear, currentMonth, question);
        } else {
          setIsLoading(false);
        }
        eventSource.close();
      };

    } catch {
      fallbackToRegularChat(currentYear, currentMonth, question);
    }
  };

  const fallbackToRegularChat = async (year, month, question) => {
    try {
      const result = await askAIQuestion(year, month, question);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        text: result.answer, 
        timestamp: new Date() 
      }]);
      setModelUsed(result.model_used || null);
    } catch {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        text: 'Unable to connect to AI services. Please try again later.', 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', { 
      hour: 'numeric', 
      minute: 'numeric', 
      hour12: true 
    }).format(date);
  };

  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach(msg => {
      const date = new Date(msg.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key = date.toLocaleDateString();
      if (date.toDateString() === today.toDateString()) key = 'Today';
      else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday';

      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    });
    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute bottom-20 right-0 w-[380px] h-[600px] flex flex-col shadow-2xl rounded-[24px] overflow-hidden border ${
              isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between backdrop-blur-md sticky top-0 z-10 border-b ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.avatarBg}`}>
                    <Bot className={`w-6 h-6 ${colors.botIcon}`} />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <span className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Finance AI
                  </span>
                  <div className={`text-xs flex items-center gap-1.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isLoading ? (
                      tryingModel ? (
                        (() => {
                          const info = getModelInfo(tryingModel);
                          return (
                            <div className="flex items-center gap-1.5 animate-pulse">
                              {info.logo.startsWith('http') ? (
                                <img 
                                  src={info.logo} 
                                  alt={info.name} 
                                  className="w-3.5 h-3.5 object-contain"
                                />
                              ) : (
                                <span className="text-xs">{info.logo}</span>
                              )}
                              <span className="font-medium">{info.name}</span>
                            </div>
                          );
                        })()
                      ) : (
                        'Typing...'
                      )
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Online
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsOpen(false)}
                  className={`p-2 rounded-full transition-colors ${
                    isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar ${
              isDark ? 'bg-[#0b1120]' : 'bg-[#f0f2f5]'
            }`}
            style={{ backgroundImage: isDark ? 'none' : 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundBlendMode: 'soft-light' }}
            >
              {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
                <div key={dateLabel} className="space-y-4">
                  <div className="flex justify-center sticky top-2 z-0">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                      isDark ? 'bg-slate-800 text-slate-400' : 'bg-white/90 text-slate-500'
                    }`}>
                      {dateLabel}
                    </span>
                  </div>
                  
                  {msgs.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    const isLast = idx === msgs.length - 1;
                    
                    return (
                      <motion.div 
                        key={msg.id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div className={`max-w-[80%] relative shadow-sm ${
                          isUser 
                            ? `${colors.userBubble} text-white rounded-2xl rounded-tr-none` 
                            : isDark 
                              ? 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-none border border-slate-700' 
                              : 'bg-white text-slate-800 rounded-2xl rounded-tl-none'
                        }`}>
                          <div className="px-4 py-2 pb-5 text-[14px] leading-relaxed whitespace-pre-wrap">
                            {msg.text}
                          </div>
                          
                          <div className={`absolute bottom-1 right-2 flex items-center gap-1 text-[9px] font-medium ${
                            isUser ? 'text-white/70' : isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            <span>{formatTime(new Date(msg.timestamp))}</span>
                            {isUser && (
                              <span>
                                {msg.status === 'read' ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 ${
                    isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white shadow-sm'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`p-3 sticky bottom-0 z-20 border-t ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <div className="flex items-end gap-2">
                <div className={`flex-1 rounded-[20px] px-4 py-2 flex items-center gap-2 border transition-all ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 focus-within:border-slate-600' 
                    : 'bg-slate-50 border-slate-200 focus-within:border-slate-300'
                }`}>
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className={`flex-1 bg-transparent border-none outline-none resize-none max-h-32 text-sm custom-scrollbar ${
                      isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                    style={{ minHeight: '24px' }}
                  />
                </div>

                <button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className={`p-3 rounded-full transition-all shadow-md flex items-center justify-center ${
                    !inputValue.trim() && !isLoading
                      ? isDark ? 'bg-slate-800 text-slate-600' : 'bg-slate-200 text-slate-400'
                      : `${colors.sendButton} text-white hover:scale-105 active:scale-95`
                  }`}
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all relative ${
          isOpen 
            ? isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'
            : `${colors.fab} text-white`
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Bot className="w-7 h-7" />
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
