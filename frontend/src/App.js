import React, { useState, useEffect } from 'react';
import './App.css';
import FloatingChatBubble from './components/FloatingChatBubble';
import ChatWidget from './components/ChatWidget';
import AuthPage from './components/AuthPage';
import { Button } from './components/ui/button';
import { User, LogOut } from 'lucide-react';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);

  // Load token and username from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    const savedUserId = localStorage.getItem('userId');
    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
      setUserId(savedUserId);
    }
  }, []);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const handleLogin = (accessToken, user) => {
    setToken(accessToken);
    setUsername(user);
    
    // Decode JWT to get user_id
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const userIdFromToken = payload.user_id;
      setUserId(userIdFromToken);
      localStorage.setItem('userId', userIdFromToken);
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
    
    localStorage.setItem('token', accessToken);
    localStorage.setItem('username', user);
    setShowAuth(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUsername(null);
    setUserId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
  };

  if (showAuth) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <div className="app-header">
        {username ? (
          <div className="user-info">
            <User size={20} />
            <span className="username-text">{username}</span>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              size="sm"
              className="logout-button"
              data-testid="logout-button"
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => setShowAuth(true)} 
            variant="default"
            className="login-button"
            data-testid="login-register-button"
          >
            <User size={16} />
            Login / Register
          </Button>
        )}
      </div>

      <div className="app-content">
        <h1 className="welcome-title">AI-Powered Consumer Protection ChatBot</h1>
        <p className="welcome-subtitle"></p>
      </div>
      
      <FloatingChatBubble onClick={toggleChat} isOpen={isChatOpen} />
      <ChatWidget isOpen={isChatOpen} onClose={closeChat} userId={userId} />
    </div>
  );
}

export default App;