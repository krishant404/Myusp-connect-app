// routes/studentRoutes.js
const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
  res.send('Student Dashboard');
});

module.exports = router;