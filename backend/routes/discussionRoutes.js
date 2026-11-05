
const express = require("express");
const router = express.Router();

const {
  createDiscussion,
  getAllDiscussions,
  updateDiscussion,
  deleteDiscussion,
} = require("../controllers/discussionController");

const authMiddleware = require("../middleware/authMiddleware");

// Public route
router.get("/", getAllDiscussions);

// Login required
router.post("/", authMiddleware, createDiscussion);
router.patch("/:id", authMiddleware, updateDiscussion);
router.delete("/:id", authMiddleware, deleteDiscussion);

module.exports = router;
