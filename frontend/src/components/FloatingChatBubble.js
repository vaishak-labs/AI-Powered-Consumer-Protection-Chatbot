import React from 'react';
import { MessageCircle } from 'lucide-react';
import './FloatingChatBubble.css';

const FloatingChatBubble = ({ onClick, isOpen }) => {
  return (
    <button
      className={`floating-chat-bubble ${isOpen ? 'open' : ''}`}
      onClick={onClick}
      data-testid="floating-chat-bubble"
      aria-label="Toggle chat"
    >
      <MessageCircle size={28} />
      {!isOpen && <span className="pulse-ring"></span>}
    </button>
  );
};

export default FloatingChatBubble;