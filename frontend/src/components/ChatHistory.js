import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Plus, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import './ChatHistory.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatHistory = ({ userId, currentSessionId, onSelectSession, onNewChat }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadSessions();
    }
  }, [userId]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/chat/sessions?user_id=${userId}`);
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="chat-history-container" data-testid="chat-history">
      <div className="chat-history-header">
        <h3 className="chat-history-title">
          <MessageSquare size={20} />
          Chat History
        </h3>
        <Button
          onClick={onNewChat}
          size="sm"
          className="new-chat-button"
          data-testid="new-chat-button"
        >
          <Plus size={16} />
          New Chat
        </Button>
      </div>

      <ScrollArea className="chat-history-list">
        {loading ? (
          <div className="chat-history-loading">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="chat-history-empty">
            <MessageSquare size={40} className="empty-icon" />
            <p>No conversations yet</p>
            <p className="empty-subtitle">Start a new chat to begin</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`chat-history-item ${currentSessionId === session.id ? 'active' : ''}`}
              onClick={() => onSelectSession(session.id)}
              data-testid={`chat-session-${session.id}`}
            >
              <div className="chat-history-item-content">
                <h4 className="chat-history-item-title">{session.title}</h4>
                <p className="chat-history-item-time">
                  <Clock size={12} />
                  {formatDate(session.updated_at || session.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  );
};

export default ChatHistory;
