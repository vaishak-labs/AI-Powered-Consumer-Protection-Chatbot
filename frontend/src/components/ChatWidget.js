import React, { useEffect, useRef, useState } from 'react';
import ChatPage from './ChatPage';
import ChatHistory from './ChatHistory';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import './ChatWidget.css';

const ChatWidget = ({ isOpen, onClose, userId }) => {
  const widgetRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        // Check if the click is not on the floating bubble
        if (!event.target.closest('.floating-chat-bubble')) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when chat is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSelectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
  };

  const handleSessionChange = (sessionId) => {
    setCurrentSessionId(sessionId);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="chat-widget-overlay" data-testid="chat-widget-overlay"></div>
      <div 
        className={`chat-widget-container ${isFullscreen ? 'fullscreen' : ''} ${userId ? 'with-history' : ''}`} 
        ref={widgetRef} 
        data-testid="chat-widget"
      >
        <div className="chat-widget-controls">
          <button
            className="chat-widget-control-btn"
            onClick={toggleFullscreen}
            data-testid="fullscreen-chat-button"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button
            className="chat-widget-control-btn close-btn"
            onClick={onClose}
            data-testid="close-chat-button"
            aria-label="Close chat"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="chat-widget-content">
          {userId && (
            <ChatHistory
              userId={userId}
              currentSessionId={currentSessionId}
              onSelectSession={handleSelectSession}
              onNewChat={handleNewChat}
            />
          )}
          <ChatPage 
            currentSessionId={currentSessionId}
            onSessionChange={handleSessionChange}
            userId={userId}
          />
        </div>
      </div>
    </>
  );
};

export default ChatWidget;