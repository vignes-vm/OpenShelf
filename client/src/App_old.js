import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch books from our Node.js server
  const fetchBooks = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/books?search=${searchTerm}`);
      setBooks(response.data);
    } catch (err) {
      console.error("Error fetching books", err);
    }
  };
  const handleHold = async (bookId, bookTitle) => {
  const rollNo = window.prompt(`Enter your Roll Number to hold "${bookTitle}":`);
  
  if (!rollNo) return; // If they cancel

  try {
    const response = await axios.post('http://localhost:5000/api/hold', {
      bookId: bookId,
      rollNo: rollNo
    });

    alert(response.data.message);
    fetchBooks(); // Refresh the list to show the new status
  } catch (err) {
    alert(err.response?.data || "Error placing hold");
  }
};
  useEffect(() => {
    fetchBooks();
  }, [searchTerm]);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>College Library Kiosk</h1>
      
      <input 
        type="text" 
        placeholder="Search by title or author..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: '10px', width: '300px', marginBottom: '20px' }}
      />

      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4' }}>
            <th>Title</th>
            <th>Author</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {books.map(book => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>
                <span style={{ color: book.status === 'available' ? 'green' : 'red' }}>
                  {book.status}
                </span>
              </td>
              <td>
                {book.status === 'available' && (
                  <button onClick={() => handleHold(book.id, book.title)}>
                    Place Hold
                </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;