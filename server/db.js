const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create a connection pool using the credentials from .env
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Initialize database schema
const initDatabase = async () => {
    try {
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await pool.query(schemaSQL);
        console.log('Database schema initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

// Test the connection and initialize schema
pool.query('SELECT NOW()', async (err, res) => {
    if (err) {
        console.error('Database connection error:', err.stack);
    } else {
        console.log('Successfully connected to PostgreSQL at:', res.rows[0].now);
        await initDatabase();
    }
});

module.exports = pool;