
const express = require("express");
const router = express.Router();

const {
  createAnswer,
  getAnswersByQuestion,
  acceptAnswer,
} = require("../controllers/answerController");

const authMiddleware = require("../middleware/authMiddleware");

// Get answers of a question
router.get("/:questionId", getAnswersByQuestion);

// Login required
router.post("/:questionId", authMiddleware, createAnswer);
router.patch("/:id/accept", authMiddleware, acceptAnswer);

module.exports = router;
