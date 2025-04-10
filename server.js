/**
 * @file server.js
 * @description Entry point for the backend server. 
 * Initializes Express, applies middleware, sets up API routes, and starts the server.
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

/**
 * Enable Cross-Origin Resource Sharing (CORS)
 * Allows frontend apps from different origins to communicate with this backend.
 */
app.use(cors());

/**
 * Middleware to parse incoming JSON requests.
 */
app.use(express.json());

/**
 * Route group for authentication endpoints.
 * @route /api/auth
 */
app.use('/api/auth', authRoutes);

/**
 * Route group for student-related endpoints.
 * @route /api/students
 */
app.use('/api/students', studentRoutes);

/**
 * Route group for admin-related endpoints.
 * @route /api/admin
 */
app.use('/api/admin', adminRoutes);

/**
 * The port on which the server will listen.
 * Loaded from environment variable or defaults to 3000.
 * @constant
 * @type {number}
 */
const PORT = process.env.PORT || 3000;

/**
 * Start the server and listen on the specified port and host.
 * Binding to 0.0.0.0 allows access from local devices/emulators.
 */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
