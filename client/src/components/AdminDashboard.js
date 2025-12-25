import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('holds');
  const [holds, setHolds] = useState([]);
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [loading, setLoading] = useState(false);

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
    if (activeTab === 'holds') {
      fetchHolds();
    } else if (activeTab === 'inventory') {
      fetchBooks();
    } else if (activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab]);

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
    try {
      await axios.post('http://localhost:5000/api/admin/return', 
        { bookId, rollNo }, 
        { withCredentials: true }
      );
      alert('Book returned successfully!');
      fetchBooks();
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
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      onLogout(); // Logout anyway
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>📊 OpenShelf Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      <nav className="admin-nav">
        <button
          className={activeTab === 'holds' ? 'active' : ''}
          onClick={() => setActiveTab('holds')}
        >
          🟡 Holds ({holds.length})
        </button>
        <button
          className={activeTab === 'fulfillment' ? 'active' : ''}
          onClick={() => setActiveTab('fulfillment')}
        >
          🔍 Fulfillment
        </button>
        <button
          className={activeTab === 'inventory' ? 'active' : ''}
          onClick={() => setActiveTab('inventory')}
        >
          📚 Inventory
        </button>
        <button
          className={activeTab === 'students' ? 'active' : ''}
          onClick={() => setActiveTab('students')}
        >
          👥 Students
        </button>
      </nav>

      <main className="admin-content">
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
                      <th>Action</th>
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
                        <td>
                          <button
                            onClick={() => handleIssue(hold.id)}
                            className="issue-button"
                          >
                            Issue Book
                          </button>
                        </td>
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
      </main>
    </div>
  );
};

export default AdminDashboard;