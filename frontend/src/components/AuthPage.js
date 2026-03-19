import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { Scale, Shield, FileText } from 'lucide-react';
import './AuthPage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthPage = ({ onLogin }) => {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', name: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      toast.success('Login successful!');
      onLogin(response.data.access_token, response.data.username);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/register`, registerData);
      toast.success('Registration successful!');
      onLogin(response.data.access_token, response.data.username);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>
      
      <div className="auth-content">
        <div className="auth-header">
          <div className="logo-container">
            <Scale className="logo-icon" size={40} />
          </div>
          <h1 className="auth-title"></h1>
          <p className="auth-subtitle"></p>
          
          <div className="feature-badges">
            
          </div>
        </div>

        <Card className="auth-card">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Sign in to access your legal assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="auth-tabs">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="auth-form">
                  <div className="form-group">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      data-testid="login-username-input"
                      type="text"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      required
                      placeholder="Enter your username"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      data-testid="login-password-input"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="auth-button" 
                    disabled={loading}
                    data-testid="login-submit-button"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="auth-form">
                  <div className="form-group">
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      data-testid="register-username-input"
                      type="text"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      required
                      placeholder="Choose a username"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      data-testid="register-email-input"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      data-testid="register-name-input"
                      type="text"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      data-testid="register-password-input"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      placeholder="Create a password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="auth-button" 
                    disabled={loading}
                    data-testid="register-submit-button"
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        
        <div class="auth-footer-text">
  <p><a href="/register" class="auth-link"></a></p>
  <a href="/" class="home-link">← Go Back to Home</a>
</div>

      </div>
    </div>
  );
};

export default AuthPage;