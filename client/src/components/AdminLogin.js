import React, { useState } from 'react';
import axios from 'axios';
import './AdminLogin.css';

const AdminLogin = ({ role, onLoginSuccess, onBack }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getRoleInfo = () => {
    const roleInfo = {
      librarian: {
        title: '📋 Librarian Login',
        description: 'Library Staff Access',
        icon: '📋',
        defaultCreds: 'librarian / lib123'
      },
      principal: {
        title: '🎯 Principal Login', 
        description: 'Administrative Access',
        icon: '🎯',
        defaultCreds: 'principal / prin123'
      }
    };
    return roleInfo[role] || { title: 'Login', description: 'Access', icon: '🔐', defaultCreds: 'admin / admin123' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/admin/login', {
        ...credentials,
        role: role
      }, {
        withCredentials: true
      });
      
      if (response.data.message === 'Login successful') {
        onLoginSuccess();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <div className="role-icon">{roleInfo.icon}</div>
          <h2>{roleInfo.title}</h2>
          <p>{roleInfo.description}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="login-buttons">
            <button type="button" onClick={onBack} className="back-button">
              Back to Home
            </button>
            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        
        <div className="login-help">
          <p><small>Default: {roleInfo.defaultCreds}</small></p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;