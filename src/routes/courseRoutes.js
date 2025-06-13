const express = require("express");
const router = express.Router();

const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseByProfesor,
} = require("../controllers/courseController");

const { authMiddleware, isProfesor, isAlumno } = require("../middlewares/authMiddleware");
router.get("/", authMiddleware,isAlumno, getAllCourses);
router.get("/profesor/:id", authMiddleware,isProfesor, getCourseByProfesor);
router.get("/:id", authMiddleware, getCourseById);
router.post("/", authMiddleware, isProfesor, createCourse);
router.put("/:id", authMiddleware, isProfesor, updateCourse);
router.delete("/:id", authMiddleware, isProfesor, deleteCourse);

module.exports = router;
