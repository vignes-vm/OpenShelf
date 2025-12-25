import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Admin Dashboard Components
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

// Hold Confirmation Modal Component
const HoldModal = ({ book, onClose, onConfirm }) => {
  const [rollNo, setRollNo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rollNo.trim()) return;
    
    setLoading(true);
    try {
      await onConfirm(rollNo);
      onClose();
    } catch (error) {
      console.error('Hold placement failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Place Hold on "{book.title}"</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="rollNo">Roll Number:</label>
            <input
              type="text"
              id="rollNo"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="Enter your roll number"
              required
              autoFocus
            />
          </div>
          <div className="modal-buttons">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !rollNo.trim()}>
              {loading ? 'Processing...' : 'Place Hold'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Hold Confirmation Ticket Component
const HoldTicket = ({ holdData, onClose }) => {
  const expiryDate = new Date(holdData.expiresAt);
  
  return (
    <div className="modal-overlay">
      <div className="modal ticket">
        <div className="ticket-header">
          <h2>✅ Hold Confirmed!</h2>
        </div>
        <div className="ticket-details">
          <h3>"{holdData.book.title}"</h3>
          <p><strong>Author:</strong> {holdData.book.author}</p>
          <p><strong>Student:</strong> {holdData.student.name} ({holdData.student.roll_no})</p>
          <p><strong>Department:</strong> {holdData.student.dept}</p>
          <div className="expiry-info">
            <h4>⏰ Collect Before:</h4>
            <p className="expiry-time">
              {expiryDate.toLocaleDateString()} at {expiryDate.toLocaleTimeString()}
            </p>
            <p className="countdown">
              (Valid for 24 hours)
            </p>
          </div>
        </div>
        <button onClick={onClose} className="ticket-close">
          Continue Browsing
        </button>
      </div>
    </div>
  );
};

function App() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [holdModal, setHoldModal] = useState(null);
  const [holdTicket, setHoldTicket] = useState(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/books?search=${search}`);
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
      alert('Error loading books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [search]);

  const handleHold = (book) => {
    if (book.status !== 'available') {
      alert('This book is not available for hold.');
      return;
    }
    setHoldModal(book);
  };

  const confirmHold = async (rollNo) => {
    try {
      const response = await axios.post('http://localhost:5000/api/hold', {
        bookId: holdModal.id,
        rollNo: rollNo
      });
      
      setHoldModal(null);
      setHoldTicket(response.data);
      fetchBooks(); // Refresh the book list
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to place hold';
      alert(errorMessage);
      throw error;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#28a745'; // Green
      case 'on_hold':
        return '#ffc107'; // Yellow
      case 'borrowed':
        return '#dc3545'; // Red
      default:
        return '#6c757d'; // Gray
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'on_hold':
        return 'On Hold';
      case 'borrowed':
        return 'Borrowed';
      default:
        return 'Unknown';
    }
  };

  // Admin mode toggle
  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    if (isAdminMode) {
      setIsAdminAuthenticated(false);
    }
  };

  if (isAdminMode) {
    if (!isAdminAuthenticated) {
      return (
        <AdminLogin
          onLoginSuccess={() => setIsAdminAuthenticated(true)}
          onBack={() => setIsAdminMode(false)}
        />
      );
    }
    return (
      <AdminDashboard
        onLogout={() => {
          setIsAdminAuthenticated(false);
          setIsAdminMode(false);
        }}
      />
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>📚 OpenShelf</h1>
          <p>Frictionless Book Discovery & Reservation</p>
          <button 
            className="admin-toggle"
            onClick={toggleAdminMode}
          >
            Admin Access
          </button>
        </div>
      </header>

      <main>
        <div className="search-container">
          <h2>Search for Books</h2>
          <input
            type="text"
            className="search-input"
            placeholder="Search by title, author, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading">Loading books...</div>
        ) : (
          <div className="books-grid">
            {books.length === 0 ? (
              <div className="no-books">
                No books found. Try a different search term.
              </div>
            ) : (
              books.map((book) => (
                <div key={book.id} className="book-card">
                  <h3>{book.title}</h3>
                  <p className="author">by {book.author}</p>
                  {book.isbn && <p className="isbn">ISBN: {book.isbn}</p>}
                  <div className="book-status">
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: getStatusColor(book.status),
                        color: 'white'
                      }}
                    >
                      {getStatusText(book.status)}
                    </span>
                  </div>
                  <button
                    className={`hold-button ${
                      book.status === 'available' ? 'available' : 'unavailable'
                    }`}
                    onClick={() => handleHold(book)}
                    disabled={book.status !== 'available'}
                  >
                    {book.status === 'available' ? 'Place Hold' : 'Unavailable'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {holdModal && (
        <HoldModal
          book={holdModal}
          onClose={() => setHoldModal(null)}
          onConfirm={confirmHold}
        />
      )}

      {holdTicket && (
        <HoldTicket
          holdData={holdTicket}
          onClose={() => setHoldTicket(null)}
        />
      )}
    </div>
  );
}

export default App;