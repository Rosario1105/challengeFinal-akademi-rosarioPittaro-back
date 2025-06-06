const express = require("express");
const router = express.Router();
const {
  createQualitation,
  updateQualitation,
  getQualitationsByStudent,
  deleteQualitation,
} = require("../controllers/qualitationController");

const { authMiddleware } = require("../middlewares/authMiddleware");
router.post("/", authMiddleware, createQualitation);
router.put("/:id", authMiddleware, updateQualitation);
router.get("/student/:id", authMiddleware, getQualitationsByStudent);
router.delete("/:id", authMiddleware, deleteQualitation);

module.exports = router;
