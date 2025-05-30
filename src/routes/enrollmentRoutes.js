const express = require('express');
const router = express.Router();
const {
  getEnrollmentsByStudent,
  getEnrollmentsByCourse,
  enrollInCourse,
  cancelEnrollment
} = require('../controllers/enrollmentController');

const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/student/:id', authMiddleware, getEnrollmentsByStudent);
router.get('/course/:id', authMiddleware, getEnrollmentsByCourse);
router.post('/', authMiddleware, enrollInCourse);
router.delete('/:id', authMiddleware, cancelEnrollment);

module.exports = router;
