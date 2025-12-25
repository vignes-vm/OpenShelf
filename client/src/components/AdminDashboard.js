import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('holds');
  const [holds, setHolds] = useState([]);
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const initialTabSet = useRef(false);

  // Book form state
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    quantity: 1
  });

  // Student form state
  const [studentForm, setStudentForm] = useState({
    rollNo: '',
    name: '',
    dept: ''
  });

  useEffect(() => {
    // Get current user info and load initial data for dashboard
    fetchCurrentUser();
    fetchBooks();
    fetchHolds();
    fetchStudents();
    fetchIssuedBooks();
  }, []);

  useEffect(() => {
    // Handle browser back button
    const handlePopState = (event) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else {
        // If no state, go back to dashboard for principals, holds for others
        if (currentUser && currentUser.role === 'principal') {
          setActiveTab('dashboard');
        } else {
          setActiveTab('holds');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Set initial history state
    if (currentUser) {
      if (currentUser.role === 'principal') {
        window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
      } else {
        window.history.replaceState({ tab: 'holds' }, '', '#holds');
      }
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentUser]);

  useEffect(() => {
    // Set default tab based on user role - only once when user is loaded
    if (currentUser && !initialTabSet.current) {
      if (currentUser.role === 'principal') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('holds');
      }
      initialTabSet.current = true;
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'holds' || activeTab === 'books-on-hold') {
      fetchHolds();
    }
    if (activeTab === 'inventory' || activeTab === 'books-total' || activeTab === 'books-available' || activeTab === 'dashboard') {
      fetchBooks();
    }
    if (activeTab === 'students' || activeTab === 'students-detail' || activeTab === 'dashboard') {
      fetchStudents();
    }
    if (activeTab === 'returns' || activeTab === 'books-borrowed' || activeTab === 'dashboard') {
      fetchIssuedBooks();
    }
    if (activeTab === 'dashboard') {
      fetchHolds();
    }
  }, [activeTab]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/me', {
        withCredentials: true
      });
      setCurrentUser(response.data.admin);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const getRoleDisplayInfo = () => {
    if (!currentUser) return { title: 'Dashboard', icon: '📊', description: 'Loading...' };
    
    const roleInfo = {
      admin: { title: 'Admin Dashboard', icon: '👤', description: 'System Administration' },
      librarian: { title: 'Librarian Dashboard', icon: '📚', description: 'Library Management' },
      principal: { title: 'Principal Dashboard', icon: '🎓', description: 'Administrative Oversight' }
    };
    
    return roleInfo[currentUser.role] || roleInfo.admin;
  };

  const canAccessInventory = () => {
    return currentUser && ['admin', 'librarian'].includes(currentUser.role);
  };

  const canManageStudents = () => {
    return currentUser && ['admin'].includes(currentUser.role);
  };

  const canViewStudentStatus = () => {
    return currentUser && ['admin', 'principal'].includes(currentUser.role);
  };

  const isPrincipal = () => {
    return currentUser && currentUser.role === 'principal';
  };

  const fetchHolds = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/holds', {
        withCredentials: true
      });
      setHolds(response.data);
    } catch (error) {
      console.error('Error fetching holds:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/books');
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/students', {
        withCredentials: true
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssuedBooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/issued-books', {
        withCredentials: true
      });
      setIssuedBooks(response.data);
    } catch (error) {
      console.error('Error fetching issued books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (transactionId) => {
    try {
      await axios.post('http://localhost:5000/api/admin/issue', 
        { transactionId }, 
        { withCredentials: true }
      );
      alert('Book issued successfully!');
      fetchHolds();
    } catch (error) {
      alert(error.response?.data?.error || 'Error issuing book');
    }
  };

  const handleReturn = async (bookId, rollNo) => {
    if (!window.confirm('Mark this book as returned and make it available?')) {
      return;
    }
    
    try {
      await axios.post('http://localhost:5000/api/admin/return', 
        { bookId, rollNo }, 
        { withCredentials: true }
      );
      alert('Book returned successfully and is now available!');
      fetchBooks();
      fetchIssuedBooks();
      // Refresh student search if showing results
      if (studentResults.length > 0) {
        searchStudent();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Error returning book');
    }
  };

  const addBook = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/books', bookForm, {
        withCredentials: true
      });
      alert('Book added successfully!');
      setBookForm({ title: '', author: '', isbn: '', quantity: 1 });
      fetchBooks();
    } catch (error) {
      alert(error.response?.data?.error || 'Error adding book');
    }
  };

  const deleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/books/${bookId}`, {
          withCredentials: true
        });
        alert('Book deleted successfully!');
        fetchBooks();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting book');
      }
    }
  };

  const addStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/students', studentForm, {
        withCredentials: true
      });
      alert('Student added successfully!');
      setStudentForm({ rollNo: '', name: '', dept: '' });
      fetchStudents();
    } catch (error) {
      alert(error.response?.data?.error || 'Error adding student');
    }
  };

  const searchStudent = async () => {
    if (!studentSearch.trim()) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/student/${studentSearch}`, {
        withCredentials: true
      });
      setStudentResults(response.data);
    } catch (error) {
      alert('Student not found or no active transactions');
      setStudentResults([]);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/admin/logout', {}, {
        withCredentials: true
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/'); // Navigate to home anyway
    }
  };

  const handleStatCardClick = (category) => {
    setActiveTab(category);
    // Push state to browser history
    window.history.pushState({ tab: category }, '', `#${category}`);
  };

  const roleDisplay = getRoleDisplayInfo();

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-info">
          <h1>{roleDisplay.icon} {roleDisplay.title}</h1>
          {currentUser && (
            <p className="user-info">Welcome, {currentUser.username} | {roleDisplay.description}</p>
          )}
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      <nav className="admin-nav">
        {isPrincipal() && (
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => {
              setActiveTab('dashboard');
              window.history.pushState({ tab: 'dashboard' }, '', '#dashboard');
            }}
          >
            📊 Dashboard
          </button>
        )}
        <button
          className={activeTab === 'holds' || activeTab === 'books-on-hold' ? 'active' : ''}
          onClick={() => {
            setActiveTab('holds');
            window.history.pushState({ tab: 'holds' }, '', '#holds');
          }}
        >
          🟡 Holds ({holds.length})
        </button>
        {!isPrincipal() && (
          <button
            className={activeTab === 'fulfillment' ? 'active' : ''}
            onClick={() => {
              setActiveTab('fulfillment');
              window.history.pushState({ tab: 'fulfillment' }, '', '#fulfillment');
            }}
          >
            🔍 Fulfillment
          </button>
        )}
        {canAccessInventory() && (
          <button
            className={activeTab === 'inventory' || activeTab === 'books-total' || activeTab === 'books-available' ? 'active' : ''}
            onClick={() => {
              setActiveTab('inventory');
              window.history.pushState({ tab: 'inventory' }, '', '#inventory');
            }}
          >
            📚 Inventory
          </button>
        )}
        <button
          className={activeTab === 'returns' || activeTab === 'books-borrowed' ? 'active' : ''}
          onClick={() => {
            setActiveTab('returns');
            window.history.pushState({ tab: 'returns' }, '', '#returns');
          }}
        >
          📤 Returns ({issuedBooks.length})
        </button>
        {canManageStudents() && (
          <button
            className={activeTab === 'students' || activeTab === 'students-detail' ? 'active' : ''}
            onClick={() => {
              setActiveTab('students');
              window.history.pushState({ tab: 'students' }, '', '#students');
            }}
          >
            👥 Students
          </button>
        )}
        {canViewStudentStatus() && (
          <button
            className={activeTab === 'student-status' ? 'active' : ''}
            onClick={() => {
              setActiveTab('student-status');
              window.history.pushState({ tab: 'student-status' }, '', '#student-status');
            }}
          >
            👥 Student Status
          </button>
        )}
      </nav>

      <main className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-section">
            <h2>Library Overview</h2>
            {loading ? (
              <div className="loading">Loading dashboard data...</div>
            ) : (
              <div className="stats-grid">
                <div className="stat-card clickable" onClick={() => handleStatCardClick('books-total')}>
                  <h4>📚 Total Books</h4>
                  <p className="stat-number">{books.length}</p>
                  <p className="stat-subtitle">Click to view all books</p>
                </div>
                <div className="stat-card clickable" onClick={() => handleStatCardClick('books-available')}>
                  <h4>✅ Available</h4>
                  <p className="stat-number">{books.filter(b => b.status === 'available').length}</p>
                  <p className="stat-subtitle">Click to view available books</p>
                </div>
                <div className="stat-card clickable" onClick={() => handleStatCardClick('books-on-hold')}>
                  <h4>🟡 On Hold</h4>
                  <p className="stat-number">{holds.length}</p>
                  <p className="stat-subtitle">Click to view holds</p>
                </div>
                <div className="stat-card clickable" onClick={() => handleStatCardClick('books-borrowed')}>
                  <h4>📖 Borrowed</h4>
                  <p className="stat-number">{issuedBooks.length}</p>
                  <p className="stat-subtitle">Click to view borrowed books</p>
                </div>
                <div className="stat-card clickable" onClick={() => handleStatCardClick('students-detail')}>
                  <h4>👥 Students</h4>
                  <p className="stat-number">{students.length}</p>
                  <p className="stat-subtitle">Click to view all students</p>
                </div>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'books-total' || activeTab === 'books-available') && (
          <div className="books-detail-section">
            <div className="section-header">
              <h2>{activeTab === 'books-total' ? '📚 All Books' : '✅ Available Books'}</h2>
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="books-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>ISBN</th>
                      <th>Status</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books
                      .filter(book => activeTab === 'books-total' || book.status === 'available')
                      .map((book) => (
                      <tr key={book.id}>
                        <td><strong>{book.title}</strong></td>
                        <td>{book.author}</td>
                        <td>{book.isbn || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${book.status}`}>
                            {book.status === 'available' ? '✅ Available' : 
                             book.status === 'on_hold' ? '🟡 On Hold' : 
                             '📖 Borrowed'}
                          </span>
                        </td>
                        <td>{book.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'books-on-hold' && (
          <div className="holds-detail-section">
            <div className="section-header">
              <h2>🟡 Books On Hold</h2>
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : holds.length === 0 ? (
              <div className="empty-state">No books currently on hold</div>
            ) : (
              <div className="holds-table">
                <table>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Student</th>
                      <th>Department</th>
                      <th>Hold Time</th>
                      <th>Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holds.map((hold) => (
                      <tr key={hold.id}>
                        <td>
                          <strong>{hold.title}</strong><br />
                          <small>by {hold.author}</small>
                        </td>
                        <td>
                          <strong>{hold.student_name}</strong><br />
                          <small>{hold.roll_no}</small>
                        </td>
                        <td>{hold.dept}</td>
                        <td>{new Date(hold.created_at).toLocaleString()}</td>
                        <td>
                          <span className={
                            new Date(hold.expires_at) < new Date() ? 'expired' : 'valid'
                          }>
                            {new Date(hold.expires_at).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'books-borrowed' && (
          <div className="borrowed-detail-section">
            <div className="section-header">
              <h2>📖 Borrowed Books</h2>
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : issuedBooks.length === 0 ? (
              <div className="empty-state">No books currently borrowed</div>
            ) : (
              <div className="issued-books-table">
                <table>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Student</th>
                      <th>Department</th>
                      <th>Borrowed Date</th>
                      <th>Days Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuedBooks.map((issue) => {
                      const issuedDays = Math.floor((new Date() - new Date(issue.created_at)) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={issue.id} className={issuedDays > 14 ? 'overdue' : ''}>
                          <td>
                            <strong>{issue.title}</strong><br />
                            <small>by {issue.author}</small>
                            {issue.isbn && <><br /><small>ISBN: {issue.isbn}</small></>}
                          </td>
                          <td>
                            <strong>{issue.student_name}</strong><br />
                            <small>{issue.roll_no}</small>
                          </td>
                          <td>{issue.dept}</td>
                          <td>{new Date(issue.created_at).toLocaleDateString()}</td>
                          <td>
                            <span className={issuedDays > 14 ? 'overdue-days' : issuedDays > 7 ? 'warning-days' : 'normal-days'}>
                              {issuedDays} days
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'students-detail' && (
          <div className="students-detail-section">
            <div className="section-header">
              <h2>👥 All Students</h2>
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="students-table">
                <table>
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.roll_no}>
                        <td>{student.roll_no}</td>
                        <td><strong>{student.name}</strong></td>
                        <td>{student.dept}</td>
                        <td>{new Date(student.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'holds' && (
          <div className="holds-section">
            <h2>Active Holds</h2>
            {loading ? (
              <div>Loading...</div>
            ) : holds.length === 0 ? (
              <div className="empty-state">No active holds</div>
            ) : (
              <div className="holds-table">
                <table>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Student</th>
                      <th>Department</th>
                      <th>Hold Time</th>
                      <th>Expires</th>
                      {!isPrincipal() && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {holds.map((hold) => (
                      <tr key={hold.id}>
                        <td>
                          <strong>{hold.title}</strong><br />
                          <small>by {hold.author}</small>
                        </td>
                        <td>
                          <strong>{hold.student_name}</strong><br />
                          <small>{hold.roll_no}</small>
                        </td>
                        <td>{hold.dept}</td>
                        <td>{new Date(hold.created_at).toLocaleString()}</td>
                        <td>
                          <span className={
                            new Date(hold.expires_at) < new Date() ? 'expired' : 'valid'
                          }>
                            {new Date(hold.expires_at).toLocaleString()}
                          </span>
                        </td>
                        {!isPrincipal() && (
                          <td>
                            <button
                              onClick={() => handleIssue(hold.id)}
                              className="issue-button"
                            >
                              Issue Book
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fulfillment' && (
          <div className="fulfillment-section">
            <h2>Fulfillment Center</h2>
            
            <div className="search-student">
              <h3>Search by Roll Number</h3>
              <div className="search-form">
                <input
                  type="text"
                  placeholder="Enter roll number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                <button onClick={searchStudent}>Search</button>
              </div>
              
              {studentResults.length > 0 && (
                <div className="student-results">
                  <h4>Active Transactions:</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Book</th>
                        <th>Action</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentResults.map((result) => (
                        <tr key={result.id}>
                          <td>
                            <strong>{result.title}</strong><br />
                            <small>by {result.author}</small>
                          </td>
                          <td>{result.action_type}</td>
                          <td>{new Date(result.created_at).toLocaleString()}</td>
                          <td>{result.status}</td>
                          <td>
                            {result.action_type === 'issue' && (
                              <button
                                onClick={() => handleReturn(result.book_id, result.roll_no)}
                                className="return-button"
                              >
                                Mark Returned
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="inventory-section">
            <h2>Inventory Management</h2>
            
            <div className="add-book-form">
              <h3>Add New Book</h3>
              <form onSubmit={addBook}>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Title"
                    value={bookForm.title}
                    onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Author"
                    value={bookForm.author}
                    onChange={(e) => setBookForm({...bookForm, author: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="ISBN"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    min="1"
                    value={bookForm.quantity}
                    onChange={(e) => setBookForm({...bookForm, quantity: parseInt(e.target.value)})}
                    required
                  />
                  <button type="submit">Add Book</button>
                </div>
              </form>
            </div>

            <div className="books-list">
              <h3>Current Inventory</h3>
              {loading ? (
                <div>Loading...</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>ISBN</th>
                      <th>Status</th>
                      <th>Quantity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <tr key={book.id}>
                        <td>{book.title}</td>
                        <td>{book.author}</td>
                        <td>{book.isbn}</td>
                        <td>
                          <span className={`status-badge ${book.status}`}>
                            {book.status}
                          </span>
                        </td>
                        <td>{book.quantity}</td>
                        <td>
                          <button
                            onClick={() => deleteBook(book.id)}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="returns-section">
            <h2>Issued Books - Ready for Return</h2>
            <p>Click "Return Book" to mark books as returned and make them available again.</p>
            
            {loading ? (
              <div>Loading...</div>
            ) : issuedBooks.length === 0 ? (
              <div className="empty-state">No books currently issued</div>
            ) : (
              <div className="issued-books-table">
                <table>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Student</th>
                      <th>Department</th>
                      <th>Issued Date</th>
                      <th>Days Issued</th>
                      {!isPrincipal() && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {issuedBooks.map((issue) => {
                      const issuedDays = Math.floor((new Date() - new Date(issue.created_at)) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={issue.id} className={issuedDays > 14 ? 'overdue' : ''}>
                          <td>
                            <strong>{issue.title}</strong><br />
                            <small>by {issue.author}</small>
                            {issue.isbn && <><br /><small>ISBN: {issue.isbn}</small></>}
                          </td>
                          <td>
                            <strong>{issue.student_name}</strong><br />
                            <small>{issue.roll_no}</small>
                          </td>
                          <td>{issue.dept}</td>
                          <td>{new Date(issue.created_at).toLocaleDateString()}</td>
                          <td>
                            <span className={issuedDays > 14 ? 'overdue-days' : issuedDays > 7 ? 'warning-days' : 'normal-days'}>
                              {issuedDays} days
                            </span>
                          </td>
                          {!isPrincipal() && (
                            <td>
                              <button
                                onClick={() => handleReturn(issue.book_id, issue.roll_no)}
                                className="return-book-button"
                              >
                                📤 Return Book
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="students-section">
            <h2>Student Management</h2>
            
            <div className="add-student-form">
              <h3>Add New Student</h3>
              <form onSubmit={addStudent}>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Roll Number"
                    value={studentForm.rollNo}
                    onChange={(e) => setStudentForm({...studentForm, rollNo: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Department"
                    value={studentForm.dept}
                    onChange={(e) => setStudentForm({...studentForm, dept: e.target.value})}
                    required
                  />
                  <button type="submit">Add Student</button>
                </div>
              </form>
            </div>

            <div className="students-list">
              <h3>Registered Students</h3>
              {loading ? (
                <div>Loading...</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.roll_no}>
                        <td>{student.roll_no}</td>
                        <td>{student.name}</td>
                        <td>{student.dept}</td>
                        <td>{new Date(student.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'student-status' && (
          <div className="student-status-section">
            <h2>Student Status Overview</h2>
            
            <div className="search-student-section">
              <h3>Search Student Activity</h3>
              <div className="search-form">
                <input
                  type="text"
                  placeholder="Enter student roll number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                <button onClick={searchStudent}>Search</button>
              </div>

              {studentResults.length > 0 && (
                <div className="student-activity">
                  <h4>Activity for Roll No: {studentSearch}</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Book</th>
                        <th>Author</th>
                        <th>Action</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentResults.map((activity) => (
                        <tr key={`${activity.id}-${activity.action_type}`}>
                          <td>{activity.title}</td>
                          <td>{activity.author}</td>
                          <td>
                            <span className={`action-type ${activity.action_type}`}>
                              {activity.action_type === 'hold' ? '🟡 Hold' : 
                               activity.action_type === 'borrow' ? '📖 Borrowed' : 
                               '📤 Returned'}
                            </span>
                          </td>
                          <td>{new Date(activity.created_at).toLocaleString()}</td>
                          <td>
                            {activity.action_type === 'hold' && activity.expires_at ? (
                              <span className={
                                new Date(activity.expires_at) < new Date() ? 'expired' : 'valid'
                              }>
                                {new Date(activity.expires_at) > new Date() ? 'Active' : 'Expired'}
                              </span>
                            ) : activity.action_type === 'borrow' ? (
                              <span className="active">Currently Borrowed</span>
                            ) : (
                              <span className="completed">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="statistics-section">
              <h3>Library Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>📚 Total Books</h4>
                  <p className="stat-number">{books.length}</p>
                </div>
                <div className="stat-card">
                  <h4>✅ Available</h4>
                  <p className="stat-number">{books.filter(b => b.status === 'available').length}</p>
                </div>
                <div className="stat-card">
                  <h4>🟡 On Hold</h4>
                  <p className="stat-number">{holds.length}</p>
                </div>
                <div className="stat-card">
                  <h4>📖 Borrowed</h4>
                  <p className="stat-number">{issuedBooks.length}</p>
                </div>
                <div className="stat-card">
                  <h4>👥 Students</h4>
                  <p className="stat-number">{students.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;