const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.post('/student', verifyToken, adminController.createStudent);
router.put('/invoice/:studentId', verifyToken, adminController.updateInvoice);
router.put('/grade/:studentId/:unitId', verifyToken, adminController.updateGrade);
router.post('/program', verifyToken, adminController.createProgram);
router.post('/unit', verifyToken, adminController.createUnit);

module.exports = router;
