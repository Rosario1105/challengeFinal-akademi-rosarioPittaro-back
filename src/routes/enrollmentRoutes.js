const express = require("express");
const router = express.Router();
const {
  getEnrollmentsByStudent,
  getEnrollmentsByCourse,
  enrollInCourse,
  cancelEnrollment,
  getStudentsByProfesor,
} = require("../controllers/enrollmentController");

const {
  authMiddleware,
  isAlumno,
  isProfesor,
} = require("../middlewares/authMiddleware");

router.get("/student/:id", authMiddleware, isAlumno, getEnrollmentsByStudent);

router.get("/course/:id", authMiddleware, isProfesor, getEnrollmentsByCourse);

router.post("/", authMiddleware, isAlumno, enrollInCourse);

router.delete("/:id", authMiddleware, isAlumno, cancelEnrollment);

router.get(
  "/student-profesor",
  authMiddleware,
  isProfesor,
  getStudentsByProfesor
);

module.exports = router;
