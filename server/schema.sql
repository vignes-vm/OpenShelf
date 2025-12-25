-- OpenShelf Database Schema
-- Run this SQL to set up the complete database structure

-- Books table with ISBN support
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20),
    quantity INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'on_hold', 'borrowed'))
);

-- Students master list for roll number validation
CREATE TABLE IF NOT EXISTS students (
    roll_no VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dept VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id),
    roll_no VARCHAR(20) NOT NULL REFERENCES students(roll_no),
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('hold', 'issue', 'return')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed'))
);

-- Admin users table for dashboard authentication
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_transactions_book_id ON transactions(book_id);
CREATE INDEX IF NOT EXISTS idx_transactions_roll_no ON transactions(roll_no);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_expires_at ON transactions(expires_at);

-- Sample data for testing
INSERT INTO students (roll_no, name, dept) VALUES 
('CS2021001', 'John Doe', 'Computer Science'),
('ME2021001', 'Jane Smith', 'Mechanical Engineering'),
('EE2021001', 'Bob Johnson', 'Electrical Engineering')
ON CONFLICT (roll_no) DO NOTHING;

INSERT INTO books (title, author, isbn, quantity) VALUES 
('Introduction to Algorithms', 'Thomas Cormen', '9780262033848', 3),
('Clean Code', 'Robert Martin', '9780132350884', 2),
('Design Patterns', 'Gang of Four', '9780201633612', 2),
('The Pragmatic Programmer', 'Andrew Hunt', '9780201616224', 1)
ON CONFLICT DO NOTHING;

-- Create default admin user (password: admin123)
INSERT INTO admin_users (username, password_hash) VALUES 
('admin', '$2a$10$uOnghGQyhHeo.MF/QI6kPu4/GmhKTQmxlVS9p7YD.FwY6xsTLOdDC')
ON CONFLICT (username) DO NOTHING;