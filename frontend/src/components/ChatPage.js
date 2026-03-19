import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { Send, Scale, Loader2, Sparkles } from 'lucide-react';
import './ChatPage.css';
import { ShieldCheck } from "lucide-react";


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatPage = ({ currentSessionId, onSessionChange, userId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(currentSessionId || null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Update local sessionId when prop changes
    setSessionId(currentSessionId);
    
    if (currentSessionId) {
      loadChatHistory(currentSessionId);
    } else {
      // Add welcome message for new chat
      setMessages([
        {
          role: 'assistant',
          content: "Hello! I'm your Consumer Protection Legal Assistant. I'm here to help you understand your consumer rights and provide guidance on legal matters related to consumer protection. How can I assist you today?",
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [currentSessionId]);

  const loadChatHistory = async (sessId) => {
    try {
      const response = await axios.get(`${API}/chat/history?session_id=${sessId}`);
      const historyMessages = response.data.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));
      
      if (historyMessages.length === 0) {
        // Add welcome message if no history
        setMessages([
          {
            role: 'assistant',
            content: "Hello! I'm your Consumer Protection Legal Assistant. I'm here to help you understand your consumer rights and provide guidance on legal matters related to consumer protection. How can I assist you today?",
            timestamp: new Date().toISOString()
          }
        ]);
      } else {
        setMessages(historyMessages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast.error('Failed to load chat history');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/chat/message`,
        {
          message: inputMessage,
          session_id: sessionId,
          user_id: userId
        }
      );

      const newSessionId = response.data.session_id;
      if (!sessionId) {
        setSessionId(newSessionId);
        if (onSessionChange) {
          onSessionChange(newSessionId);
        }
      }

      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    if (onSessionChange) {
      onSessionChange(null);
    }
    setMessages([
      {
        role: 'assistant',
        content: "Hello! I'm your Consumer Protection Legal Assistant. I'm here to help you understand your consumer rights and provide guidance on legal matters related to consumer protection. How can I assist you today?",
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className="chat-container" data-testid="chat-page">
      <div className="chat-header">
        <div className="header-left">
          <div className="header-logo">
  <ShieldCheck size={28} />
          </div>
          <div className="header-info">
            <h1 className="header-title">AI-Powered Consumer Protection Chatbot</h1>
            <p className="header-subtitle">Your digital lawyer who never charges, argues, or sleeps..</p>
          </div>
        </div>
        <div className="header-right">
          <Button
            variant="outline"
            onClick={handleNewChat}
            className="new-chat-btn"
            data-testid="new-chat-button"
          >
            <Sparkles size={18} className="mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      <div className="chat-main">
        <ScrollArea className="chat-messages" data-testid="chat-messages">
          <div className="messages-container">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                data-testid={`message-${message.role}-${index}`}
              >
                <div className="message-avatar">
                  {message.role === 'user' ? (
                    <div className="user-avatar">You</div>
                  ) : (
                    <Scale size={20} />
                  )}
                </div>
                <div className="message-content">
                  <div className="message-role">
                    {message.role === 'user' ? 'You' : 'Legal Assistant'}
                  </div>
                  <div className="message-text">{message.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant-message">
                <div className="message-avatar">
                  <Scale size={20} />
                </div>
                <div className="message-content">
                  <div className="message-role">Legal Assistant</div>
                  <div className="message-text typing-indicator">
                    <Loader2 className="animate-spin" size={20} />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="chat-input-container">
          <Card className="chat-input-card">
            <form onSubmit={sendMessage} className="chat-form">
              <Input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about consumer rights, warranties, refunds..."
                className="chat-input"
                disabled={loading}
                data-testid="chat-input"
              />
              <Button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="send-button"
                data-testid="send-button"
              >
                <Send size={20} />
              </Button>
            </form>
          </Card>
          <p className="chat-disclaimer">
            This chatbot provides general legal information only. For specific legal advice, please consult a licensed attorney.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;