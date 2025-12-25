const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cron = require('node-cron');
const pool = require('./db');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: 'openshelf-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.adminId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
};

// Cron job to release expired holds (runs every hour)
cron.schedule('0 * * * *', async () => {
    console.log('Running hold expiry check...');
    try {
        const result = await pool.query(`
            UPDATE transactions 
            SET status = 'expired' 
            WHERE action_type = 'hold' 
            AND status = 'active' 
            AND expires_at <= NOW()
            RETURNING book_id
        `);

        // Update book status back to available for expired holds
        for (const row of result.rows) {
            await pool.query(`
                UPDATE books 
                SET status = 'available' 
                WHERE id = $1 
                AND status = 'on_hold'
            `, [row.book_id]);
        }

        console.log(`Released ${result.rows.length} expired holds`);
    } catch (err) {
        console.error('Error in hold expiry job:', err);
    }
});

// PUBLIC KIOSK ENDPOINTS

// Search books (supports title, author, ISBN)
app.get('/api/books', async (req, res) => {
    try {
        const { search = '' } = req.query;
        const query = `
            SELECT id, title, author, isbn, status, quantity 
            FROM books 
            WHERE LOWER(title) LIKE LOWER($1) 
            OR LOWER(author) LIKE LOWER($1)
            OR isbn LIKE $1
            ORDER BY title
        `;
        const result = await pool.query(query, [`%${search}%`]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error searching books:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Validate student roll number
app.post('/api/validate-student', async (req, res) => {
    try {
        const { rollNo } = req.body;
        const result = await pool.query('SELECT * FROM students WHERE roll_no = $1', [rollNo]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid roll number' });
        }

        res.json({ valid: true, student: result.rows[0] });
    } catch (err) {
        console.error('Error validating student:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Place hold on book
app.post('/api/hold', async (req, res) => {
    try {
        const { bookId, rollNo } = req.body;

        // Start transaction
        await pool.query('BEGIN');

        // Validate student
        const studentResult = await pool.query('SELECT * FROM students WHERE roll_no = $1', [rollNo]);
        if (studentResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid roll number' });
        }

        // Check if book is available
        const bookResult = await pool.query('SELECT * FROM books WHERE id = $1', [bookId]);
        if (bookResult.rows.length === 0 || bookResult.rows[0].status !== 'available') {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: 'Book not available for hold' });
        }

        // Check if student already has this book on hold
        const existingHold = await pool.query(
            'SELECT * FROM transactions WHERE book_id = $1 AND roll_no = $2 AND action_type = $3 AND status = $4',
            [bookId, rollNo, 'hold', 'active']
        );
        if (existingHold.rows.length > 0) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: 'You already have a hold on this book' });
        }

        // Update book status
        await pool.query('UPDATE books SET status = $1 WHERE id = $2', ['on_hold', bookId]);

        // Create hold transaction (expires in 24 hours)
        const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const transactionResult = await pool.query(`
            INSERT INTO transactions (book_id, roll_no, action_type, expires_at)
            VALUES ($1, $2, $3, $4) RETURNING *
        `, [bookId, rollNo, 'hold', expiryTime]);

        await pool.query('COMMIT');

        res.json({
            message: 'Hold placed successfully! Please collect the book within 24 hours.',
            transaction: transactionResult.rows[0],
            book: bookResult.rows[0],
            student: studentResult.rows[0],
            expiresAt: expiryTime
        });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error placing hold:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ADMIN AUTHENTICATION ENDPOINTS

// Admin login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const result = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const admin = result.rows[0];
        const passwordValid = await bcrypt.compare(password, admin.password_hash);
        
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.adminId = admin.id;
        req.session.adminUsername = admin.username;
        
        res.json({ message: 'Login successful', admin: { id: admin.id, username: admin.username } });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Check admin session
app.get('/api/admin/me', requireAuth, (req, res) => {
    res.json({ 
        authenticated: true, 
        admin: { 
            id: req.session.adminId, 
            username: req.session.adminUsername 
        } 
    });
});

// ADMIN DASHBOARD ENDPOINTS

// Get all holds
app.get('/api/admin/holds', requireAuth, async (req, res) => {
    try {
        const query = `
            SELECT t.id, t.book_id, t.roll_no, t.created_at, t.expires_at, t.status,
                   b.title, b.author, b.isbn,
                   s.name as student_name, s.dept
            FROM transactions t
            JOIN books b ON t.book_id = b.id
            JOIN students s ON t.roll_no = s.roll_no
            WHERE t.action_type = 'hold' AND t.status = 'active'
            ORDER BY t.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching holds:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Convert hold to issue
app.post('/api/admin/issue', requireAuth, async (req, res) => {
    try {
        const { transactionId } = req.body;

        await pool.query('BEGIN');

        // Get the hold transaction
        const holdResult = await pool.query(`
            SELECT * FROM transactions 
            WHERE id = $1 AND action_type = 'hold' AND status = 'active'
        `, [transactionId]);

        if (holdResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Hold not found or already processed' });
        }

        const hold = holdResult.rows[0];

        // Mark hold as completed
        await pool.query(`
            UPDATE transactions 
            SET status = 'completed' 
            WHERE id = $1
        `, [transactionId]);

        // Create issue transaction
        await pool.query(`
            INSERT INTO transactions (book_id, roll_no, action_type)
            VALUES ($1, $2, $3)
        `, [hold.book_id, hold.roll_no, 'issue']);

        // Update book status
        await pool.query(`
            UPDATE books 
            SET status = 'borrowed' 
            WHERE id = $1
        `, [hold.book_id]);

        await pool.query('COMMIT');
        res.json({ message: 'Book issued successfully' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error issuing book:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Mark book as returned
app.post('/api/admin/return', requireAuth, async (req, res) => {
    try {
        const { bookId, rollNo } = req.body;

        await pool.query('BEGIN');

        // Find active issue transaction
        const issueResult = await pool.query(`
            SELECT * FROM transactions 
            WHERE book_id = $1 AND roll_no = $2 AND action_type = 'issue' AND status = 'active'
        `, [bookId, rollNo]);

        if (issueResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Active issue not found' });
        }

        // Mark issue as completed
        await pool.query(`
            UPDATE transactions 
            SET status = 'completed' 
            WHERE id = $1
        `, [issueResult.rows[0].id]);

        // Create return transaction
        await pool.query(`
            INSERT INTO transactions (book_id, roll_no, action_type)
            VALUES ($1, $2, $3)
        `, [bookId, rollNo, 'return']);

        // Update book status back to available
        await pool.query(`
            UPDATE books 
            SET status = 'available' 
            WHERE id = $1
        `, [bookId]);

        await pool.query('COMMIT');
        res.json({ message: 'Book returned successfully' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error returning book:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all issued books
app.get('/api/admin/issued-books', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT t.id, t.book_id, t.roll_no, t.created_at,
             b.title, b.author, b.isbn,
             s.name as student_name, s.dept
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      JOIN students s ON t.roll_no = s.roll_no
      WHERE t.action_type = 'issue' AND t.status = 'active'
      ORDER BY t.created_at ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching issued books:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Search by roll number
app.get('/api/admin/student/:rollNo', requireAuth, async (req, res) => {
    try {
        const { rollNo } = req.params;
        
        const query = `
            SELECT t.id, t.book_id, t.action_type, t.created_at, t.expires_at, t.status,
                   b.title, b.author, b.isbn,
                   s.name as student_name, s.dept
            FROM transactions t
            JOIN books b ON t.book_id = b.id
            JOIN students s ON t.roll_no = s.roll_no
            WHERE t.roll_no = $1 AND t.status = 'active'
            ORDER BY t.created_at DESC
        `;
        
        const result = await pool.query(query, [rollNo]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error searching by roll number:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// INVENTORY MANAGEMENT ENDPOINTS

// Add new book
app.post('/api/admin/books', requireAuth, async (req, res) => {
    try {
        const { title, author, isbn, quantity = 1 } = req.body;
        
        const result = await pool.query(`
            INSERT INTO books (title, author, isbn, quantity)
            VALUES ($1, $2, $3, $4) RETURNING *
        `, [title, author, isbn, quantity]);
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error adding book:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update book
app.put('/api/admin/books/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, isbn, quantity } = req.body;
        
        const result = await pool.query(`
            UPDATE books 
            SET title = $1, author = $2, isbn = $3, quantity = $4
            WHERE id = $5 RETURNING *
        `, [title, author, isbn, quantity, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating book:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete book
app.delete('/api/admin/books/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if book has active transactions
        const activeTransactions = await pool.query(`
            SELECT * FROM transactions 
            WHERE book_id = $1 AND status = 'active'
        `, [id]);
        
        if (activeTransactions.rows.length > 0) {
            return res.status(400).json({ error: 'Cannot delete book with active transactions' });
        }
        
        const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        res.json({ message: 'Book deleted successfully' });
    } catch (err) {
        console.error('Error deleting book:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all students
app.get('/api/admin/students', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM students ORDER BY roll_no');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Add new student
app.post('/api/admin/students', requireAuth, async (req, res) => {
    try {
        const { rollNo, name, dept } = req.body;
        
        const result = await pool.query(`
            INSERT INTO students (roll_no, name, dept)
            VALUES ($1, $2, $3) RETURNING *
        `, [rollNo, name, dept]);
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error adding student:', err);
        if (err.code === '23505') { // Unique constraint violation
            res.status(400).json({ error: 'Roll number already exists' });
        } else {
            res.status(500).json({ error: 'Database error' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});