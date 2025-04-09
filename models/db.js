const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' }); // 👈 Force loading from parent dir

// Debug print
console.log('🔍 DB Credentials:', {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

const pool = new Pool({
  user: process.env.DB_USER || 'pgadmin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'myappdb',
  password: process.env.DB_PASSWORD || 'krishantpostgres',
  port: parseInt(process.env.DB_PORT) || 5432,
});

module.exports = pool;
