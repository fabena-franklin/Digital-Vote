// db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD, // Loaded from the .env file
  port: process.env.DB_PORT,
});

// Optional: Test the connection when the module loads
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Error acquiring client: Database connection failed', err.stack);
    }
    console.log('✅ Successfully connected to PostgreSQL database!');
    release(); // Release the client back to the pool
});

// Export the pool so other files (like your routes) can run queries
module.exports = {
  query: (text, params) => pool.query(text, params),
};