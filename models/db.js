/**
 * @file db.js
 * @description This module sets up and exports a PostgreSQL connection pool using the pg library.
 * Configuration values are loaded from a .env file in the project root.
 * 
 * @requires pg
 * @requires dotenv
 */

const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' }); // Load environment variables from parent .env file

// Debug print to verify DB credentials from environment variables
console.log('🔍 DB Credentials:', {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

/**
 * @constant pool
 * @type {Pool}
 * @description A connection pool instance for PostgreSQL database operations.
 * Falls back to default values if environment variables are not provided.
 */
const pool = new Pool({
  user: process.env.DB_USER || 'pgadmin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'myappdb',
  password: process.env.DB_PASSWORD || 'krishantpostgres',
  port: parseInt(process.env.DB_PORT) || 5432,
});

/**
 * @module db
 * @description Exports the PostgreSQL connection pool to be used across the app for database queries.
 */
module.exports = pool;
