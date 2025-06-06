const express = require("express");
const router = express.Router();
const {
  register,
  login,
  recoverPasswordRequest,
  resetPassword,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

router.post("/forgot-password", recoverPasswordRequest);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
