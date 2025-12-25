import React, { useState } from 'react';
import axios from 'axios';
import './AdminLogin.css';

const AdminLogin = ({ onLoginSuccess, onBack }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/admin/login', credentials, {
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

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <h2>🔐 Admin Login</h2>
          <p>Library Staff Access</p>
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
              Back to Kiosk
            </button>
            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        
        <div className="login-help">
          <p><small>Default: admin / admin123</small></p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;