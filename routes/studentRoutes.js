const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const studentController = require('../controllers/studentController');


router.get('/:id/invoice', verifyToken, studentController.getInvoice);
router.get('/:id/grades', verifyToken, studentController.getGrades);
router.get('/:id/audit', verifyToken, studentController.getAudit);
router.get('/:id/history', verifyToken, studentController.getUnitHistory);
router.get('/:id/details', verifyToken, studentController.getStudentDetails); // ✅ THIS LINE
router.post('/register-units', verifyToken, studentController.registerUnits);

router.get('/:id/full-audit', verifyToken, studentController.getFullAudit);

router.get('/available-units', verifyToken, studentController.getAvailableUnits);

module.exports = router;
