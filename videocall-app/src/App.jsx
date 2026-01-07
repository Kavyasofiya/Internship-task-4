import React, { useState, useEffect } from 'react';
import CallPage from './components/CallPage';
import CallLogs from './components/CallLogs';
import './App.css';

// Simple mock authentication
const useMockAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('videocall_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const signIn = () => {
    const mockUser = {
      uid: 'user-' + Date.now(),
      displayName: 'Demo User',
      email: 'demo@example.com',
      photoURL: null
    };
    setUser(mockUser);
    localStorage.setItem('videocall_user', JSON.stringify(mockUser));
    return Promise.resolve({ user: mockUser });
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('videocall_user');
    return Promise.resolve();
  };

  return { user, signIn, signOut };
};

function App() {
  const { user, signIn, signOut } = useMockAuth();
  const [activeTab, setActiveTab] = useState('call');

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>📞 VideoCall App</h1>
          <p>Real-time voice and video calling with call logs</p>
          <button className="signin-btn" onClick={handleSignIn}>
            Enter Demo Mode
          </button>
          <p className="demo-note">(Working offline - no Firebase required)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>📞 VideoCall App</h1>
        </div>
        <div className="user-info">
          <span>Welcome, {user.displayName}</span>
          <button className="signout-btn" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </header>

      <nav className="app-nav">
        <button 
          className={`nav-btn ${activeTab === 'call' ? 'active' : ''}`}
          onClick={() => setActiveTab('call')}
        >
          📞 Make Call
        </button>
        <button 
          className={`nav-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Call Logs
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'call' ? <CallPage user={user} /> : <CallLogs user={user} />}
      </main>
    </div>
  );
}

export default App;