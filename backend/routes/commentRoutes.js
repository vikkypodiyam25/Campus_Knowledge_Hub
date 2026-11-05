
const express = require("express");
const router = express.Router();

const {
  createComment,
  getComments,
  deleteComment,
} = require("../controllers/commentController");

const authMiddleware = require("../middleware/authMiddleware");

// Get comments
router.get("/:discussionId", getComments);

// Login required
router.post("/:discussionId", authMiddleware, createComment);
router.delete("/:id", authMiddleware, deleteComment);

module.exports = router;
