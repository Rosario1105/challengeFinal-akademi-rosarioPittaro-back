const express = require("express");
const router = express.Router();
const { getStatsOverview } = require("../controllers/statsController");
const { authMiddleware,isSuperAdmin } = require("../middlewares/authMiddleware");

router.get("/overview", authMiddleware, isSuperAdmin, getStatsOverview);

module.exports = router;
