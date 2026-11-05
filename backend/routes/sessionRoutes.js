
const express = require("express");
const router = express.Router();

const {
  createSession,
  getAllSessions,
  getSessionById,
  registerSession,
  unregisterSession,
  updateSessionStatus,
} = require("../controllers/sessionController");

const authMiddleware = require("../middleware/authMiddleware");

// Public routes
router.get("/", getAllSessions);
router.get("/:id", getSessionById);

// Login required
router.post("/", authMiddleware, createSession);
router.post("/:id/register", authMiddleware, registerSession);
router.delete("/:id/unregister", authMiddleware, unregisterSession);
router.patch("/:id/status", authMiddleware, updateSessionStatus);

module.exports = router;
