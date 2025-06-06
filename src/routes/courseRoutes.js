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

const { authMiddleware, isProfesor } = require("../middlewares/authMiddleware");
router.get("/", authMiddleware, getAllCourses);

router.get("/profesorId/List", authMiddleware, isProfesor, getCourseByProfesor);

router.get("/:id", authMiddleware, getCourseById);
router.post("/", authMiddleware, isProfesor, createCourse);
router.put("/:id", authMiddleware, isProfesor, updateCourse);
router.delete("/:id", authMiddleware, isProfesor, deleteCourse);

module.exports = router;
