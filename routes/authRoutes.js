/**
 * Authentication route for user login.
 * Handles both student and admin authentication.
 * 
 * @module routes/authRoutes
 */

const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

/**
 * @route POST /login
 * @description Authenticates a user (student or admin) based on credentials.
 * Expects userType, username/studentId, and password in the request body.
 * @access Public
 */
router.post('/login', login);

module.exports = router;
