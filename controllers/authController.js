// controllers/authController.js
const pool = require('../models/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { userType, studentId, username, password } = req.body;
  console.log('Incoming login request:', req.body);

  try {
    let query, values;

    if (userType === 'student') {
      query = 'SELECT * FROM students WHERE student_id = $1';
      values = [studentId];
    } else if (userType === 'admin') {
      query = 'SELECT * FROM admins WHERE username = $1';
      values = [username];
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    console.log('Query:', query, 'Values:', values);

    const result = await pool.query(query, values);
    const user = result.rows[0];

    console.log('User from DB:', user);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password match:', validPassword);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, userType },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login };