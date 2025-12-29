const pool = require('./db');
const fs = require('fs');

async function updateSchema() {
  try {
    console.log('Reading schema file...');
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    
    console.log('Executing schema updates...');
    await pool.query(schema);
    
    console.log('✅ Database schema updated successfully!');
    console.log('New tables added: renewals, fines');
    console.log('Enhanced transactions table with due_date column');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating schema:', err.message);
    process.exit(1);
  }
}

updateSchema();