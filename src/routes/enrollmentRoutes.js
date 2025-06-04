const express = require('express');
const router = express.Router();
const {
  getEnrollmentsByStudent,
  getEnrollmentsByCourse,
  enrollInCourse,
  cancelEnrollment,
  getStudentsByProfesor
} = require('../controllers/enrollmentController');

const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/student/:id', authMiddleware, getEnrollmentsByStudent);
router.get('/course/:id', authMiddleware, getEnrollmentsByCourse);
router.post('/', authMiddleware, enrollInCourse);
router.delete('/:id', authMiddleware, cancelEnrollment);
router.get('/student-profesor', authMiddleware, getStudentsByProfesor);


module.exports = router;
