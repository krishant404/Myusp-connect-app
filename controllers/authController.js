// controllers/authController.js

// Import necessary modules and dependencies
const pool = require('../models/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login controller function to authenticate users
const login = async (req, res) => {
  // Destructure user details from the request body
  const { userType, studentId, username, password } = req.body;
  console.log('Incoming login request:', req.body);

  try {
    let query, values;

    // Determine the query and values based on the user type
    if (userType === 'student') {
      // For students, search by student_id
      query = 'SELECT * FROM students WHERE student_id = $1';
      values = [studentId];
    } else if (userType === 'admin') {
      // For admins, search by username
      query = 'SELECT * FROM admins WHERE username = $1';
      values = [username];
    } else {
      // Return error response if the user type is invalid
      return res.status(400).json({ message: 'Invalid user type' });
    }

    console.log('Query:', query, 'Values:', values);

    // Execute the query to retrieve user data from the database
    const result = await pool.query(query, values);
    const user = result.rows[0];
    console.log('User from DB:', user);

    // Check if user exists, return unauthorized if not found
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Compare the input password with the stored hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password match:', validPassword);

    // Return error if password does not match
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Upon successful authentication, sign and generate a JWT token valid for 2 hours
    const token = jwt.sign(
      { id: user.id, userType },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Return the token as a JSON response
    res.json({ token });
  } catch (err) {
    // Log the error and return server error response
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export the login function for use in route handlers
module.exports = { login };