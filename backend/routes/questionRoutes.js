
const express = require("express");
const router = express.Router();

const {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestion,
} = require("..controllers/questionController");

const authMiddleware = require("../middleware/authMiddleware");

// Public route
router.get("/", getAllQuestions);
router.get("/:id", getQuestionById);

// Protected routes (login required)
router.post("/", authMiddleware, createQuestion);
router.delete("/:id", authMiddleware, deleteQuestion);

module.exports = router;
