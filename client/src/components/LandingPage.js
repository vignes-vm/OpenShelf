import React from 'react';
import './LandingPage.css';

const LandingPage = ({ onKioskAccess, onAdminAccess }) => {
  return (
    <div className="landing-page">
      <div className="landing-container">
        <header className="landing-header">
          <h1>📚 OpenShelf Library System</h1>
          <p className="tagline">Frictionless Library Experience</p>
        </header>

        <main className="landing-main">
          <div className="access-cards">
            {/* Student Kiosk Card */}
            <div className="access-card student-card">
              <div className="card-icon">👥</div>
              <h2>Student Access</h2>
              <p>Search books, check availability, and place holds</p>
              <ul className="feature-list">
                <li>📖 Browse book catalog</li>
                <li>🔍 Search by title, author, or ISBN</li>
                <li>📝 Place 24-hour holds</li>
                <li>🎫 Get digital hold tickets</li>
              </ul>
              <button 
                className="access-button student-button"
                onClick={onKioskAccess}
              >
                Enter Kiosk
              </button>
            </div>

            {/* Librarian Card */}
            <div className="access-card librarian-card">
              <div className="card-icon">📋</div>
              <h2>Librarian Access</h2>
              <p>Manage day-to-day library operations</p>
              <ul className="feature-list">
                <li>📊 View and manage holds</li>
                <li>✅ Issue books to students</li>
                <li>📤 Process returns</li>
                <li>👥 Student lookup</li>
              </ul>
              <button 
                className="access-button librarian-button"
                onClick={() => onAdminAccess('librarian')}
              >
                Librarian Login
              </button>
            </div>

            {/* Principal Card */}
            <div className="access-card principal-card">
              <div className="card-icon">🎯</div>
              <h2>Principal Access</h2>
              <p>Complete administrative control</p>
              <ul className="feature-list">
                <li>📚 Full inventory management</li>
                <li>➕ Add/edit/delete books</li>
                <li>👨‍🎓 Student database management</li>
                <li>📈 System overview and reports</li>
              </ul>
              <button 
                className="access-button principal-button"
                onClick={() => onAdminAccess('principal')}
              >
                Principal Login
              </button>
            </div>
          </div>

          <div className="info-section">
            <div className="info-card">
              <h3>🕒 Library Hours</h3>
              <div className="hours-grid">
                <div>Monday - Friday</div>
                <div>8:00 AM - 6:00 PM</div>
                <div>Saturday</div>
                <div>9:00 AM - 4:00 PM</div>
                <div>Sunday</div>
                <div>Closed</div>
              </div>
            </div>
            
            <div className="info-card">
              <h3>📖 Quick Help</h3>
              <ul>
                <li><strong>Hold Duration:</strong> 24 hours</li>
                <li><strong>Loan Period:</strong> 14 days</li>
                <li><strong>Renewal:</strong> Contact librarian</li>
                <li><strong>Lost Books:</strong> Report immediately</li>
              </ul>
            </div>
          </div>
        </main>

        <footer className="landing-footer">
          <p>&copy; 2025 OpenShelf Library System | College Library Management</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;