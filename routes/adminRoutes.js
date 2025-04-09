// routes/adminRoutes.js
const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
  res.send('Admin Dashboard');
});

module.exports = router;