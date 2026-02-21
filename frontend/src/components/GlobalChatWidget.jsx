import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { askAIQuestion } from '../api';
import { ChatWidgetButton, ChatWidgetPopup } from '../pages/DashboardUI';

export default function GlobalChatWidget() {
  const { theme } = useTheme();
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useState(false);
  const [chatWidgetMessages, setChatWidgetMessages] = useState([]);
  const [chatWidgetInput, setChatWidgetInput] = useState('');
  const [chatWidgetLoading, setChatWidgetLoading] = useState(false);
  const [chatWidgetTryingModel, setChatWidgetTryingModel] = useState(null);
  const [chatWidgetModelUsed, setChatWidgetModelUsed] = useState(null);

  // Default to current date for context
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  useEffect(() => {
    if (isChatWidgetOpen && chatWidgetMessages.length === 0) {
      setChatWidgetMessages([{ role: 'assistant', text: 'Hi! How can I help you with your finances today?' }]);
    }
  }, [isChatWidgetOpen]);

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

      const eventSourceUrl = `${apiUrl}/ai/chat_progress?year=${currentYear}&month=${currentMonth}&question=${encodeURIComponent(question)}&token=${token}`;
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
          const result = await askAIQuestion(currentYear, currentMonth, question);
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
        const result = await askAIQuestion(currentYear, currentMonth, question);
        setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: result.answer }]);
        setChatWidgetModelUsed(result.model_used || null);
      } catch {
        setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: 'Unable to connect to AI services. Please try again later.' }]);
      } finally {
        setChatWidgetLoading(false);
      }
    }
  };

  return (
    <>
      <ChatWidgetButton 
        theme={theme}
        isChatWidgetOpen={isChatWidgetOpen}
        setIsChatWidgetOpen={setIsChatWidgetOpen}
      />

      <ChatWidgetPopup 
        theme={theme}
        isChatWidgetOpen={isChatWidgetOpen}
        chatWidgetMessages={chatWidgetMessages}
        chatWidgetInput={chatWidgetInput}
        setChatWidgetInput={setChatWidgetInput}
        chatWidgetLoading={chatWidgetLoading}
        chatWidgetTryingModel={chatWidgetTryingModel}
        chatWidgetModelUsed={chatWidgetModelUsed}
        handleWidgetAsk={handleWidgetAsk}
        setIsChatWidgetOpen={setIsChatWidgetOpen}
      />
    </>
  );
}
