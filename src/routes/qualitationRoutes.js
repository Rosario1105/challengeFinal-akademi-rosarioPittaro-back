const express = require("express");
const router = express.Router();
const {
  createQualitation,
  updateQualitation,
  getQualitationsByStudent,
  deleteQualitation,
} = require("../controllers/qualitationController");

const { authMiddleware,isProfesor } = require("../middlewares/authMiddleware");
router.post("/", authMiddleware, createQualitation,isProfesor);
router.put("/:id", authMiddleware, updateQualitation,isProfesor);
router.get("/student/:id", authMiddleware, getQualitationsByStudent);
router.delete("/:id", authMiddleware, deleteQualitation,isProfesor);

module.exports = router;
