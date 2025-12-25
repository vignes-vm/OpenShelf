const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Importing the bridge we just made

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to read JSON data from the frontend

// Basic Route to test if the server is running
app.get('/', (req, res) => {
    res.send('Library System Server is Running!');
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});

// SEARCH API: Get all books or search by title
app.get('/api/books', async (req, res) => {
    try {
        const { search } = req.query; // This looks for ?search=... in the URL
        let queryText = 'SELECT * FROM books ORDER BY id ASC';
        let values = [];

        if (search) {
            queryText = 'SELECT * FROM books WHERE title ILIKE $1 OR author ILIKE $1';
            values = [`%${search}%` || '']; // The % allows partial matches (e.g., "Gats" for "Gatsby")
        }

        const allBooks = await pool.query(queryText, values);
        res.json(allBooks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// HOLD API: Reserve a booK
app.post('/api/hold', async (req, res) => {
    const { bookId, rollNo } = req.body;

    try {
        // Start a transaction
        await pool.query('BEGIN');

        // 1. Check if book is available and update it
        const bookCheck = await pool.query(
            "UPDATE books SET status = 'on_hold' WHERE id = $1 AND status = 'available' RETURNING *",
            [bookId]
        );

        if (bookCheck.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(400).send("Book is no longer available.");
        }

        // 2. Insert into transactions table
        await pool.query(
            "INSERT INTO transactions (book_id, roll_no, action_type) VALUES ($1, $2, 'hold')",
            [bookId, rollNo]
        );

        // Commit the transaction
        await pool.query('COMMIT');

        res.json({ message: `Success! ${bookCheck.rows[0].title} is reserved for 24 hours.` });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// GET ALL HOLDS: For the Admin to see who requested what
app.get('/api/admin/holds', async (req, res) => {
    try {
        const query = `
            SELECT t.id, b.title, b.author, t.roll_no, t.created_at, b.id as book_id
            FROM transactions t
            JOIN books b ON t.book_id = b.id
            WHERE b.status = 'on_hold' AND t.action_type = 'hold'
            ORDER BY t.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ISSUE BOOK: Admin confirms student is at the desk
app.post('/api/admin/issue', async (req, res) => {
    const { bookId } = req.body;
    try {
        await pool.query("UPDATE books SET status = 'issued' WHERE id = $1", [bookId]);
        res.json({ message: "Book officially issued!" });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});